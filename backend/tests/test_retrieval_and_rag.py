"""Retrieval plumbing and the chat path when RAG is switched on."""

from dataclasses import replace

import httpx
import pytest
from fastapi.testclient import TestClient

from api import deps
from auth import throttling
from config import settings
from main import app
from services import chat_service, retrieval, sources
from services.retrieval import Passage, RetrievalError, SupabaseRetriever
from tests.test_api import FakePlatform, ask, use_platform


@pytest.fixture(autouse=True)
def clean_state():
    throttling._requests.clear()
    yield
    app.dependency_overrides.clear()
    throttling._requests.clear()
    retrieval._retriever.cache_clear()
    chat_service.load_system_prompt.cache_clear()
    sources.load_sources.cache_clear()


@pytest.fixture
def client():
    return TestClient(app)


class FakeRetriever:
    def __init__(self, passages=None, error=None):
        self.passages = passages or []
        self.error = error
        self.queries = []

    def search(self, query):
        self.queries.append(query)
        if self.error:
            raise self.error
        return list(self.passages)


NETS = Passage(
    id="06-personal-prevention/do-mosquito-nets-help",
    document_id="06-personal-prevention",
    heading="Do mosquito nets help against malaria?",
    content=(
        "Do mosquito nets help against malaria?\n"
        "Insecticide-treated nets lower the chance of malaria by stopping bites "
        "while people sleep. WHO recommends them as a core prevention measure."
    ),
    source_ids=("who-malaria",),
    similarity=0.82,
)


def test_supabase_retriever_posts_the_question_to_the_edge_function():
    seen = []

    def handler(request: httpx.Request) -> httpx.Response:
        seen.append(request)
        return httpx.Response(
            200,
            json={
                "passages": [
                    {
                        "id": NETS.id,
                        "document_id": NETS.document_id,
                        "heading": NETS.heading,
                        "content": NETS.content,
                        "source_ids": list(NETS.source_ids),
                        "similarity": NETS.similarity,
                    }
                ]
            },
        )

    client = httpx.Client(transport=httpx.MockTransport(handler))
    retriever = SupabaseRetriever(
        "https://example.supabase.co",
        "service-role",
        match_count=3,
        match_threshold=0.55,
        client=client,
    )
    rows = retriever.search("Do nets help?")

    assert [p.id for p in rows] == [NETS.id]
    request = seen[0]
    assert request.url.path.endswith("/functions/v1/rag-query")
    assert request.headers["authorization"] == "Bearer service-role"
    assert b"Do nets help?" in request.content


def test_unknown_source_ids_from_retrieval_are_dropped():
    def handler(request):
        return httpx.Response(
            200,
            json={
                "passages": [
                    {
                        "id": "x",
                        "document_id": "x",
                        "heading": "H",
                        "content": "Hello",
                        "source_ids": ["who-malaria", "not-a-real-source"],
                        "similarity": 0.9,
                    }
                ]
            },
        )

    rows = SupabaseRetriever(
        "https://example.supabase.co",
        "key",
        match_count=4,
        match_threshold=0.5,
        client=httpx.Client(transport=httpx.MockTransport(handler)),
    ).search("hello")
    assert rows[0].source_ids == ("who-malaria",)


def test_chat_without_rag_still_answers(client, monkeypatch):
    monkeypatch.setattr(
        chat_service, "settings", replace(settings, supabase_service_role_key="")
    )
    monkeypatch.setattr(retrieval, "settings", replace(settings, supabase_service_role_key=""))
    retrieval._retriever.cache_clear()
    use_platform(FakePlatform())
    body = ask(client, "How does malaria spread?").json()
    assert body["guardrail"] is None
    assert body["response"]


def test_rag_injects_passages_and_returns_their_sources(client, monkeypatch):
    monkeypatch.setattr(
        chat_service,
        "settings",
        replace(settings, supabase_url="https://example.supabase.co", supabase_service_role_key="sr"),
    )
    fake = FakeRetriever([NETS])
    monkeypatch.setattr(chat_service, "get_retriever", lambda: fake)
    platform = use_platform(
        FakePlatform(
            reply=(
                "Scope: malaria\n"
                "Insecticide-treated nets lower the chance of malaria by stopping bites.\n"
                "Sources: who-malaria"
            )
        )
    )

    body = ask(client, "Do mosquito nets help against malaria?").json()

    assert body["guardrail"] is None
    assert "nets" in body["response"].lower()
    assert [s["id"] for s in body["sources"]] == ["who-malaria"]
    assert fake.queries == ["Do mosquito nets help against malaria?"]
    # The model saw the retrieved passage in the system prompt.
    system = platform.calls[0][0]["content"]
    assert "Retrieved knowledge" in system
    assert "Insecticide-treated nets" in system


def test_rag_with_no_passages_does_not_call_the_model(client, monkeypatch):
    monkeypatch.setattr(
        chat_service,
        "settings",
        replace(settings, supabase_url="https://example.supabase.co", supabase_service_role_key="sr"),
    )
    monkeypatch.setattr(chat_service, "get_retriever", lambda: FakeRetriever([]))
    platform = use_platform(FakePlatform())

    body = ask(client, "Do mosquito nets help against malaria?").json()

    assert body["guardrail"] == "no_knowledge"
    assert "knowledge base" in body["response"].lower()
    assert platform.calls == []


def test_rag_greetings_skip_retrieval(client, monkeypatch):
    monkeypatch.setattr(
        chat_service,
        "settings",
        replace(settings, supabase_url="https://example.supabase.co", supabase_service_role_key="sr"),
    )
    fake = FakeRetriever([NETS])
    monkeypatch.setattr(chat_service, "get_retriever", lambda: fake)
    use_platform(FakePlatform(reply="Scope: malaria\nHello. How can I help with malaria today?\nSources: none"))

    body = ask(client, "Hello").json()

    assert body["guardrail"] is None
    assert fake.queries == []
    assert body["sources"] == []


def test_rag_retrieval_failure_is_a_fixed_reply(client, monkeypatch):
    monkeypatch.setattr(
        chat_service,
        "settings",
        replace(settings, supabase_url="https://example.supabase.co", supabase_service_role_key="sr"),
    )
    monkeypatch.setattr(
        chat_service,
        "get_retriever",
        lambda: FakeRetriever(error=RetrievalError("down")),
    )
    platform = use_platform(FakePlatform())
    body = ask(client, "Do mosquito nets help?").json()
    assert body["guardrail"] == "retrieval_failed"
    assert platform.calls == []


def test_medicine_named_only_in_a_passage_is_allowed(client, monkeypatch):
    """ACT is not on the blocked list; chloroquine is. A passage may unlock it."""
    monkeypatch.setattr(
        chat_service,
        "settings",
        replace(settings, supabase_url="https://example.supabase.co", supabase_service_role_key="sr"),
    )
    passage = Passage(
        id="05-treatment/acts",
        document_id="05-treatment",
        heading="What is the usual treatment?",
        content=(
            "What is the usual treatment?\n"
            "After a positive test, a health worker chooses an ACT. "
            "Chloroquine is no longer the recommended treatment in most of Africa."
        ),
        source_ids=("who-malaria-qa",),
        similarity=0.9,
    )
    monkeypatch.setattr(chat_service, "get_retriever", lambda: FakeRetriever([passage]))
    use_platform(
        FakePlatform(
            reply=(
                "Scope: malaria\n"
                "A health worker chooses an ACT after a positive test. "
                "Chloroquine is no longer the recommended treatment in most of Africa.\n"
                "Sources: who-malaria-qa"
            )
        )
    )
    body = ask(client, "What is the usual malaria treatment?").json()
    assert body["guardrail"] is None
    assert "chloroquine" in body["response"].lower()


def test_health_reports_rag_flag(client):
    body = client.get("/api/v1/health").json()
    assert "rag" in body
    assert isinstance(body["rag"], bool)
