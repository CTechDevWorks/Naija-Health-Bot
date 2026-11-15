"""Only approved sources and links may reach the user."""

from services.sources import extract_sources, load_sources, remove_unapproved_links, sources_for_prompt


def test_every_approved_source_is_offered_to_the_model():
    listing = sources_for_prompt()
    for source_id in load_sources():
        assert source_id in listing


def test_sources_line_is_removed_and_resolved():
    text = "Malaria spreads through mosquito bites.\n\nSources: who-malaria, ncdc"
    body, sources = extract_sources(text)

    assert body == "Malaria spreads through mosquito bites."
    assert [s.id for s in sources] == ["who-malaria", "ncdc"]
    assert sources[0].url == "https://www.who.int/news-room/fact-sheets/detail/malaria"


def test_invented_source_ids_are_dropped():
    body, sources = extract_sources("Some answer.\nSources: lancet-2023, who-malaria")
    assert body == "Some answer."
    assert [s.id for s in sources] == ["who-malaria"]


def test_sources_none_yields_no_sources():
    body, sources = extract_sources("I am not sure about that.\nSources: none")
    assert body == "I am not sure about that."
    assert sources == []


def test_bold_sources_line_and_duplicates_are_handled():
    body, sources = extract_sources("Answer.\n**Sources:** who-malaria, who-malaria")
    assert body == "Answer."
    assert [s.id for s in sources] == ["who-malaria"]


def test_answer_without_a_sources_line_is_left_alone():
    body, sources = extract_sources("Sources of infection include mosquito bites.")
    assert body == "Sources of infection include mosquito bites."
    assert sources == []


def test_unapproved_links_are_removed():
    text = "Read more at https://example.com/malaria-cure. Stay safe."
    assert remove_unapproved_links(text) == "Read more at. Stay safe."


def test_approved_links_are_kept():
    text = "See https://ncdc.gov.ng/ for updates."
    assert remove_unapproved_links(text) == text


def test_markdown_links_become_plain_text():
    text = "See [this page](https://example.com/x) today."
    assert remove_unapproved_links(text) == "See this page today."


def test_approved_sources_are_malaria_related():
    ids = set(load_sources())
    assert "who-malaria" in ids and "ncdc" in ids
    # Non-malaria topics that used to ship with the scaffold must stay out.
    assert "who-healthy-diet" not in ids
    assert "who-physical-activity" not in ids
    assert len(ids) >= 10
