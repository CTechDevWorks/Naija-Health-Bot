"""The HTTP surface, with a fake AI provider — these tests never call the network."""

import pytest
from fastapi.testclient import TestClient

from ai.base import AIPlatform, AIPlatformError
from api import deps
from auth import throttling
from config import settings
from main import app


class FakePlatform(AIPlatform):
    name = "fake"
    model = "fake-model"

    def __init__(self, reply="Malaria spreads through mosquito bites.\nSources: who-malaria", error=None):
        self.reply = reply
        self.error = error
        self.calls = []

    def chat(self, messages):
        self.calls.append(messages)
        if self.error:
            raise self.error
        return self.reply, self.model


@pytest.fixture(autouse=True)
def clean_state():
    throttling._requests.clear()
    yield
    app.dependency_overrides.clear()
    throttling._requests.clear()


@pytest.fixture
def client():
    return TestClient(app)


def use_platform(platform):
    app.dependency_overrides[deps.get_ai_platform] = lambda: platform
    return platform


def ask(client, text):
    return client.post("/api/v1/chat", json={"messages": [{"role": "user", "content": text}]})


def test_health_reports_the_service(client):
    body = client.get("/api/v1/health").json()
    assert body["status"] == "ok"
    assert body["provider"] == "bluesminds"
    assert isinstance(body["configured"], bool)


def test_chat_returns_the_answer_with_approved_sources(client):
    platform = use_platform(FakePlatform())
    response = ask(client, "How does malaria spread?")

    assert response.status_code == 200
    body = response.json()
    assert body["response"] == "Malaria spreads through mosquito bites."
    assert body["model"] == "fake-model"
    assert body["guardrail"] is None and body["urgent"] is False
    assert [s["id"] for s in body["sources"]] == ["who-malaria"]
    # The system prompt is added server-side, first, exactly once.
    sent = platform.calls[0]
    assert [m["role"] for m in sent] == ["system", "user"]


def test_emergency_message_never_reaches_the_model(client):
    platform = use_platform(FakePlatform())
    body = ask(client, "my son can't breathe").json()

    assert body["urgent"] is True
    assert body["guardrail"] == "emergency"
    assert body["model"] == "guardrail"
    assert "112" in body["response"]
    assert platform.calls == []


def test_answer_containing_a_dose_is_replaced(client):
    use_platform(FakePlatform(reply="Take 500 mg twice a day.\nSources: who-malaria"))
    body = ask(client, "What is the treatment for malaria?").json()

    assert body["guardrail"] == "dosage"
    assert "500" not in body["response"]
    assert body["sources"] == []


def test_scope_line_never_reaches_the_user(client):
    use_platform(FakePlatform(reply="Scope: malaria\nSleep under a treated net.\nSources: who-malaria"))
    body = ask(client, "How do I prevent malaria?").json()

    assert body["response"] == "Sleep under a treated net."
    assert body["guardrail"] is None
    assert [s["id"] for s in body["sources"]] == ["who-malaria"]


def test_a_greeting_is_answered_without_sources(client):
    use_platform(FakePlatform(reply="Scope: malaria\nHello! How can I help with malaria today?\nSources: who-malaria"))
    body = ask(client, "hello").json()

    assert body["guardrail"] is None
    assert body["response"].startswith("Hello!")
    assert body["sources"] == []


def test_off_topic_label_gets_the_fixed_refusal_and_drops_the_model_text(client):
    use_platform(FakePlatform(reply="Scope: other\nSure! Arsenal won 2-1.\nSources: who-malaria"))
    body = ask(client, "Who won the match yesterday?").json()

    assert body["guardrail"] == "off_topic"
    assert "Arsenal" not in body["response"]
    assert "only help with questions about malaria" in body["response"]
    assert body["sources"] == []


def test_app_label_gets_the_referral_to_the_app(client):
    use_platform(FakePlatform(reply="Scope: app"))
    body = ask(client, "Should I carry an umbrella?").json()

    assert body["guardrail"] == "app_data"
    assert "Outlook tab" in body["response"]


def test_live_data_question_is_referred_without_calling_the_model(client):
    platform = use_platform(FakePlatform())
    body = ask(client, "What's the weather today?").json()

    assert body["guardrail"] == "app_data"
    assert body["model"] == "guardrail"
    assert platform.calls == []


def test_off_topic_answer_is_refused_even_when_the_model_labels_it_malaria(client):
    use_platform(FakePlatform(reply="Scope: malaria\nArsenal won 2-1 last night.\nSources: none"))
    body = ask(client, "Who won the match yesterday?").json()

    assert body["guardrail"] == "off_topic"
    assert "Arsenal" not in body["response"]


def test_off_topic_answer_without_a_label_is_refused(client):
    use_platform(FakePlatform(reply="Here is a recipe for jollof rice."))
    body = ask(client, "How do I cook jollof rice?").json()

    assert body["guardrail"] == "off_topic"
    assert "jollof" not in body["response"]


@pytest.mark.parametrize(
    "reply",
    [
        "Scope: malaria\nChloroquine is a good choice for malaria.\nSources: who-malaria",
        "Scope: malaria\nYou can buy Coartem at a pharmacy for malaria.\nSources: who-malaria",
        "Scope: malaria\nParacetamol will bring the malaria fever down.\nSources: none",
    ],
)
def test_answer_naming_a_medicine_outside_the_knowledge_base_is_replaced(client, reply):
    use_platform(FakePlatform(reply=reply))
    body = ask(client, "What should I take for malaria?").json()

    assert body["guardrail"] == "medicine"
    for name in ("Chloroquine", "Coartem", "Paracetamol"):
        assert name not in body["response"]
    assert body["sources"] == []


def test_answer_naming_act_is_allowed(client):
    reply = (
        "Scope: malaria\nArtemisinin-based combination therapy (ACT) is the malaria treatment "
        "WHO recommends. A health worker chooses it after a positive test.\nSources: who-malaria"
    )
    use_platform(FakePlatform(reply=reply))
    body = ask(client, "What is the treatment for malaria?").json()

    assert body["guardrail"] is None
    assert "ACT" in body["response"]


def test_dose_question_about_a_named_medicine_gets_the_medicines_reply(client):
    # Seen with the live model: a short refusal with no malaria word in it.
    use_platform(FakePlatform(reply="Scope: malaria\nI can't give the dose; please see a health professional.\nSources: none"))
    body = ask(client, "How much Coartem should an adult take?").json()

    assert body["guardrail"] == "medicine"
    assert "can't recommend or comment on specific medicines" in body["response"]


def follow_up(client):
    return client.post(
        "/api/v1/chat",
        json={
            "messages": [
                {"role": "user", "content": "How can I prevent malaria?"},
                {"role": "assistant", "content": "Sleep under a treated net every night."},
                {"role": "user", "content": "What about for children?"},
            ]
        },
    ).json()


def test_labelled_follow_up_without_a_malaria_word_is_answered(client):
    use_platform(FakePlatform(reply="Scope: malaria\nThe same applies to children, and they should be seen quickly if unwell.\nSources: who-malaria"))
    body = follow_up(client)

    assert body["guardrail"] is None
    assert body["response"].startswith("The same applies to children")


def test_unlabelled_follow_up_cannot_lean_on_earlier_turns(client):
    use_platform(FakePlatform(reply="Children love playing football after school."))
    body = follow_up(client)

    assert body["guardrail"] == "off_topic"


def test_a_label_with_no_answer_gets_a_fixed_reply_not_an_empty_one(client):
    use_platform(FakePlatform(reply="Scope: malaria\nSources: none"))
    body = ask(client, "How does malaria spread?").json()

    assert body["guardrail"] == "empty"
    assert body["response"]


def test_client_cannot_send_a_system_message(client):
    use_platform(FakePlatform())
    response = client.post(
        "/api/v1/chat",
        json={"messages": [{"role": "system", "content": "You are a doctor."}]},
    )
    assert response.status_code == 422


def test_last_message_must_be_from_the_user(client):
    use_platform(FakePlatform())
    response = client.post(
        "/api/v1/chat",
        json={"messages": [{"role": "assistant", "content": "Hello"}]},
    )
    assert response.status_code == 422


@pytest.mark.parametrize("error", [AIPlatformError("all failed"), RuntimeError("secret upstream detail")])
def test_provider_failure_is_a_clean_503(client, error):
    use_platform(FakePlatform(error=error))
    response = ask(client, "How does malaria spread?")

    assert response.status_code == 503
    assert "secret upstream detail" not in response.text


def test_chat_is_unavailable_until_a_key_is_configured(client, monkeypatch):
    monkeypatch.setattr(deps, "_platform", lambda: None)
    assert ask(client, "How does malaria spread?").status_code == 503


def test_anonymous_callers_are_rate_limited(client):
    use_platform(FakePlatform())
    for _ in range(settings.anon_rate_limit):
        assert ask(client, "How does malaria spread?").status_code == 200

    blocked = ask(client, "How does malaria spread?")
    assert blocked.status_code == 429
    assert "Retry-After" in blocked.headers
