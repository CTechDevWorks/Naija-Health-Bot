"""Supabase access for health report sources, jobs, and feed rows."""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

import httpx

from config import settings

log = logging.getLogger("naija_health.reports.store")


class ReportsStoreError(RuntimeError):
    """Raised when Supabase REST calls fail."""


def _configured() -> bool:
    return bool(settings.supabase_url and settings.supabase_service_role_key)


def _headers(*, prefer: str = "return=representation") -> dict[str, str]:
    key = settings.supabase_service_role_key
    return {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": prefer,
    }


def _url(path: str) -> str:
    return f"{settings.supabase_url.rstrip('/')}/rest/v1/{path}"


def _client() -> httpx.Client:
    return httpx.Client(timeout=60.0)


def require_store() -> None:
    if not _configured():
        raise ReportsStoreError(
            "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running the updates job."
        )


def list_active_sources() -> list[dict[str, Any]]:
    require_store()
    with _client() as client:
        response = client.get(
            _url("update_sources"),
            headers=_headers(prefer="return=representation"),
            params={
                "select": "id,slug,name,homepage_url,feed_url,region,priority,is_active",
                "is_active": "eq.true",
                "order": "priority.asc",
            },
        )
    if response.status_code >= 400:
        raise ReportsStoreError(f"list sources failed ({response.status_code}): {response.text[:300]}")
    return response.json()


def create_job_run(triggered_for_date: str) -> dict[str, Any]:
    require_store()
    with _client() as client:
        response = client.post(
            _url("update_job_runs"),
            headers=_headers(),
            json={"triggered_for_date": triggered_for_date, "status": "running"},
        )
    if response.status_code >= 400:
        raise ReportsStoreError(f"create job run failed ({response.status_code}): {response.text[:300]}")
    rows = response.json()
    return rows[0] if isinstance(rows, list) else rows


def finish_job_run(
    job_id: str,
    *,
    status: str,
    items_fetched: int,
    items_inserted: int,
    items_skipped: int,
    error_message: str | None = None,
) -> None:
    require_store()
    payload: dict[str, Any] = {
        "status": status,
        "finished_at": "now()",
        "items_fetched": items_fetched,
        "items_inserted": items_inserted,
        "items_skipped": items_skipped,
        "error_message": error_message,
    }
    payload["finished_at"] = datetime.now(timezone.utc).isoformat()

    with _client() as client:
        response = client.patch(
            _url("update_job_runs"),
            headers=_headers(prefer="return=minimal"),
            params={"id": f"eq.{job_id}"},
            json=payload,
        )
    if response.status_code >= 400:
        raise ReportsStoreError(f"finish job run failed ({response.status_code}): {response.text[:300]}")


def existing_url_hashes(hashes: list[str]) -> set[str]:
    if not hashes:
        return set()
    require_store()
    found: set[str] = set()
    # PostgREST `in` filter; chunk to keep URLs short.
    chunk_size = 40
    with _client() as client:
        for start in range(0, len(hashes), chunk_size):
            chunk = hashes[start : start + chunk_size]
            joined = ",".join(chunk)
            response = client.get(
                _url("health_reports"),
                headers=_headers(prefer="return=representation"),
                params={"select": "url_hash", "url_hash": f"in.({joined})"},
            )
            if response.status_code >= 400:
                raise ReportsStoreError(
                    f"dedupe lookup failed ({response.status_code}): {response.text[:300]}"
                )
            for row in response.json():
                found.add(row["url_hash"])
    return found


def insert_report(row: dict[str, Any]) -> dict[str, Any] | None:
    """Insert one report. Returns the row, or None on duplicate conflict."""
    require_store()
    with _client() as client:
        response = client.post(
            _url("health_reports"),
            headers={
                **_headers(),
                "Prefer": "return=representation,resolution=ignore-duplicates",
            },
            json=row,
        )
    if response.status_code >= 400:
        raise ReportsStoreError(f"insert report failed ({response.status_code}): {response.text[:300]}")
    rows = response.json()
    if not rows:
        return None
    return rows[0] if isinstance(rows, list) else rows


def list_published_reports(*, limit: int = 30) -> list[dict[str, Any]]:
    require_store()
    # Nigeria first, then high urgency, then newest — approximate with client sort
    # after fetch because PostgREST cannot easily express custom enum ordering.
    with _client() as client:
        response = client.get(
            _url("health_reports"),
            headers=_headers(prefer="return=representation"),
            params={
                "select": (
                    "id,title,summary,original_url,published_at,ingested_at,topic,"
                    "location_scope,urgency,is_ai_summary,"
                    "source:update_sources(id,slug,name,region)"
                ),
                "is_published": "eq.true",
                "order": "published_at.desc",
                "limit": str(max(1, min(limit, 100))),
            },
        )
    if response.status_code >= 400:
        raise ReportsStoreError(f"list reports failed ({response.status_code}): {response.text[:300]}")

    scope_rank = {"nigeria": 0, "west_africa": 1, "global": 2}
    urgency_rank = {"high": 0, "medium": 1, "low": 2}

    def published_ts(row: dict[str, Any]) -> float:
        raw = row.get("published_at")
        if not raw:
            return 0.0
        try:
            return datetime.fromisoformat(str(raw).replace("Z", "+00:00")).timestamp()
        except ValueError:
            return 0.0

    rows = response.json()
    rows.sort(
        key=lambda r: (
            scope_rank.get(r.get("location_scope", "global"), 9),
            urgency_rank.get(r.get("urgency", "low"), 9),
            -published_ts(r),
        )
    )
    return rows
