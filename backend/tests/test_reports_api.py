"""Health reports API surface (no live network)."""

from __future__ import annotations

from fastapi.testclient import TestClient

from main import app
from services import reports_store


def test_list_health_reports(monkeypatch):
    monkeypatch.setattr(
        reports_store,
        "list_published_reports",
        lambda limit=30: [
            {
                "id": "11111111-1111-1111-1111-111111111111",
                "title": "Lassa fever update",
                "summary": "NCDC published an update on Lassa fever in Nigeria.",
                "original_url": "https://ncdc.gov.ng/diseases/sitreps?cat=5",
                "published_at": "2026-11-15T07:00:00+01:00",
                "ingested_at": "2026-11-15T07:05:00+01:00",
                "topic": "outbreak",
                "location_scope": "nigeria",
                "urgency": "high",
                "is_ai_summary": True,
                "source": {
                    "id": "22222222-2222-2222-2222-222222222222",
                    "slug": "ncdc",
                    "name": "Nigeria Centre for Disease Control and Prevention",
                    "region": "nigeria",
                },
            }
        ],
    )
    client = TestClient(app)
    response = client.get("/api/v1/health-reports")
    assert response.status_code == 200
    body = response.json()
    assert body["count"] == 1
    assert body["reports"][0]["title"] == "Lassa fever update"
    assert body["reports"][0]["source"]["slug"] == "ncdc"
