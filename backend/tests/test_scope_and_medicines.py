"""Malaria-only scope, app referrals and the medicine-name check."""

import pytest

from guardrails import (
    SCOPE_APP,
    SCOPE_MALARIA,
    SCOPE_OTHER,
    find_unapproved_medicines,
    is_on_topic,
    screen_input,
    split_scope,
)

# ── Live-data requests are sent to the app, without calling the model ─────


@pytest.mark.parametrize(
    "message",
    [
        "What's the weather today?",
        "what is the weather like",
        "Weather forecast for my area",
        "Will it rain tomorrow?",
        "is it going to rain",
        "What is today's temperature?",
        "humidity right now",
        "What is the current malaria risk?",
        "malaria risk in my area",
        "What's the outlook for my state",
        "Malaria cases in Lagos today",
        "How many malaria cases are there in my area?",
        "Is there an outbreak near me?",
        "Any malaria outbreak?",
        "latest malaria news",
        "Is malaria high in my area right now",
    ],
)
def test_live_data_requests_are_referred_to_the_app(message):
    verdict = screen_input(message)
    assert verdict.blocked and not verdict.urgent
    assert verdict.label == "app_data"
    assert "Outlook" in verdict.reply and "Updates" in verdict.reply


@pytest.mark.parametrize(
    "message",
    [
        "Why does rain matter for malaria here?",
        "How does weather affect malaria?",
        "Why is there more malaria in the rainy season?",
        "What does area-level risk mean?",
        "What does the outlook for my area mean?",
        "Explain the malaria risk level in my area",
        "What temperature do mosquitoes like?",
        "Who is most at risk of malaria?",
        "What is the risk of malaria in pregnancy?",
        "Is there a new malaria vaccine?",
        "How many people get malaria each year?",
    ],
)
def test_malaria_knowledge_questions_are_not_mistaken_for_live_data(message):
    assert not screen_input(message).blocked


def test_an_emergency_still_wins_over_everything_else():
    verdict = screen_input("What's the weather today, my son can't breathe")
    assert verdict.label == "emergency" and verdict.urgent


# ── The model's Scope line ────────────────────────────────────────────────


@pytest.mark.parametrize(
    "reply, label, body",
    [
        ("Scope: malaria\nUse a net.\nSources: who-malaria", SCOPE_MALARIA, "Use a net.\nSources: who-malaria"),
        ("Scope: other", SCOPE_OTHER, ""),
        ("Scope: app\n", SCOPE_APP, ""),
        ("**Scope:** other\nHere is a poem anyway.", SCOPE_OTHER, "Here is a poem anyway."),
        ("scope: off-topic", SCOPE_OTHER, ""),
        ("Use a net.\nScope: malaria", SCOPE_MALARIA, "Use a net."),
    ],
)
def test_scope_line_is_read_and_removed(reply, label, body):
    assert split_scope(reply) == (label, body)


@pytest.mark.parametrize(
    "reply",
    [
        "Use a net every night.",
        "Scope: football\nThe match starts at 8.",
        "The scope of malaria control is wide.",
    ],
)
def test_missing_or_unknown_scope_label_is_none(reply):
    label, _ = split_scope(reply)
    assert label is None


def test_the_first_scope_line_wins_and_all_are_removed():
    assert split_scope("Scope: other\nScope: malaria\nText") == (SCOPE_OTHER, "Text")


# ── Deterministic backstop behind the label ───────────────────────────────


@pytest.mark.parametrize(
    "question, reply",
    [
        ("How does malaria spread?", "Through bites."),
        ("I have a fever and headache", "It could be several things. A malaria test is the way to know."),
        ("How do I stop mosquitoes?", "Sleep under a treated net."),
        ("What about children?", "Children under 5 should sleep under an insecticide-treated net."),
        ("thanks", "You're welcome."),
        ("Good morning", "Good morning. How can I help?"),
        ("What does area-level risk mean?", "It describes a place, not a person."),
    ],
)
def test_malaria_exchanges_pass_the_backstop(question, reply):
    assert is_on_topic(question, reply)


@pytest.mark.parametrize(
    "question, reply",
    [
        ("Who won the match yesterday?", "Arsenal won 2-1."),
        ("Write me a python script", "def main(): pass"),
        ("How do I lose weight?", "Eat less and move more."),
        ("thanks, now tell me a joke", "Why did the chicken cross the road?"),
    ],
)
def test_off_topic_exchanges_fail_the_backstop(question, reply):
    assert not is_on_topic(question, reply)


# ── Medicine names ────────────────────────────────────────────────────────


@pytest.mark.parametrize(
    "answer, names",
    [
        ("Chloroquine is a common choice.", ["chloroquine"]),
        ("You can take Coartem or Lonart.", ["coartem", "lonart"]),
        ("PARACETAMOL helps with the fever.", ["paracetamol"]),
        ("Ask for artemether-lumefantrine.", ["artemether", "lumefantrine"]),
        ("Some people use P-Alaxin.", ["p-alaxin"]),
        ("Septrin (co-trimoxazole) is an antibiotic.", ["co-trimoxazole", "septrin"]),
    ],
)
def test_listed_medicines_are_found(answer, names):
    assert find_unapproved_medicines(answer) == names


@pytest.mark.parametrize(
    "answer",
    [
        "Artemisinin-based combination therapy (ACT) is the treatment WHO recommends.",
        "ACTs are chosen by a health worker after a positive test.",
        "Use a repellent containing DEET, IR3535 or icaridin.",
        "The RTS,S and R21 vaccines are for young children.",
        "That medicine is something a pharmacist can advise on.",
        "Act quickly if a child has a fever.",
        "Herbs and agbo do not cure malaria.",
    ],
)
def test_what_the_knowledge_base_names_is_allowed(answer):
    assert find_unapproved_medicines(answer) == []


def test_a_medicine_named_in_the_retrieved_passage_becomes_allowed():
    passage = "Chloroquine is recommended only where the parasite is still sensitive to it."
    answer = "Chloroquine is only used in some places, and quinine is another option."
    assert find_unapproved_medicines(answer, allowed_context=passage) == ["quinine"]
