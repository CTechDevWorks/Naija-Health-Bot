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
