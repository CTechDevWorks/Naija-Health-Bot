"""Supabase access for Expo push device tokens."""

from __future__ import annotations

import logging
import re
from datetime import datetime, timezone
from typing import Any

import httpx

from config import settings

log = logging.getLogger("naija_health.push.store")

_TOKEN_RE = re.compile(r"^(Expo(nent)?PushToken)\[.+]$")


class PushStoreError(RuntimeError):
    """Raised when Supabase REST calls for push tokens fail."""


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
    return httpx.Client(timeout=30.0)


def require_store() -> None:
    if not _configured():
        raise PushStoreError(
            "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before registering push tokens."
        )


def is_valid_expo_token(token: str) -> bool:
    return bool(_TOKEN_RE.match(token.strip()))


def upsert_token(token: str, platform: str | None = None) -> dict[str, Any]:
    require_store()
    cleaned = token.strip()
    if not is_valid_expo_token(cleaned):
        raise PushStoreError("Invalid Expo push token format.")
    plat = platform if platform in ("ios", "android", "web", "unknown") else "unknown"
    now = datetime.now(timezone.utc).isoformat()
    with _client() as client:
        response = client.post(
            _url("device_push_tokens"),
            headers={
                **_headers(),
                "Prefer": "resolution=merge-duplicates,return=representation",
            },
            params={"on_conflict": "token"},
            json={
                "token": cleaned,
                "platform": plat,
                "enabled": True,
                "updated_at": now,
            },
        )
    if response.status_code >= 400:
        raise PushStoreError(
            f"upsert push token failed ({response.status_code}): {response.text[:300]}"
        )
    rows = response.json()
    return rows[0] if isinstance(rows, list) and rows else {"token": cleaned}


def set_token_enabled(token: str, *, enabled: bool) -> None:
    require_store()
    cleaned = token.strip()
    if not is_valid_expo_token(cleaned):
        raise PushStoreError("Invalid Expo push token format.")
    now = datetime.now(timezone.utc).isoformat()
    with _client() as client:
        response = client.patch(
            _url("device_push_tokens"),
            headers=_headers(prefer="return=minimal"),
            params={"token": f"eq.{cleaned}"},
            json={"enabled": enabled, "updated_at": now},
        )
    if response.status_code >= 400:
        raise PushStoreError(
            f"update push token failed ({response.status_code}): {response.text[:300]}"
        )


def list_enabled_tokens() -> list[str]:
    if not _configured():
        return []
    with _client() as client:
        response = client.get(
            _url("device_push_tokens"),
            headers=_headers(prefer="return=representation"),
            params={
                "select": "token",
                "enabled": "eq.true",
            },
        )
    if response.status_code >= 400:
        log.warning(
            "list push tokens failed (%s): %s",
            response.status_code,
            response.text[:300],
        )
        return []
    rows = response.json()
    if not isinstance(rows, list):
        return []
    return [str(row["token"]) for row in rows if row.get("token")]


def disable_tokens(tokens: list[str]) -> None:
    """Mark tokens as disabled (e.g. after Expo reports DeviceNotRegistered)."""
    if not tokens or not _configured():
        return
    now = datetime.now(timezone.utc).isoformat()
    with _client() as client:
        for token in tokens:
            response = client.patch(
                _url("device_push_tokens"),
                headers=_headers(prefer="return=minimal"),
                params={"token": f"eq.{token}"},
                json={"enabled": False, "updated_at": now},
            )
            if response.status_code >= 400:
                log.warning(
                    "disable push token failed (%s): %s",
                    response.status_code,
                    response.text[:200],
                )
