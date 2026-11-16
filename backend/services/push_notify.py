"""Send Expo push notifications when new health reports are published."""

from __future__ import annotations

import logging
from typing import Any

import httpx

from services import push_store

log = logging.getLogger("naija_health.push.notify")

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"
# Expo accepts up to 100 messages per request.
_CHUNK = 100


def _chunks(items: list[str], size: int) -> list[list[str]]:
    return [items[i : i + size] for i in range(0, len(items), size)]


def notify_new_health_updates(
    *,
    count: int,
    titles: list[str] | None = None,
) -> dict[str, Any]:
    """
    Push a local notification to every enabled device token.
    No-op when count < 1 or no tokens are registered.
    """
    if count < 1:
        return {"sent": 0, "skipped": "no_new_reports"}

    tokens = push_store.list_enabled_tokens()
    if not tokens:
        log.info("no push tokens registered — skip notify")
        return {"sent": 0, "skipped": "no_tokens"}

    if count == 1 and titles:
        title = "New health update"
        body = titles[0][:160]
    else:
        title = "New health updates"
        body = f"{count} new official health updates are ready in 9ja Health."
        if titles:
            body = f"{titles[0][:100]} · and {count - 1} more"

    messages = [
        {
            "to": token,
            "title": title,
            "body": body,
            "sound": "default",
            "priority": "high",
            "data": {"screen": "updates"},
        }
        for token in tokens
    ]

    sent = 0
    stale: list[str] = []
    with httpx.Client(timeout=30.0) as client:
        for batch in _chunks(messages, _CHUNK):
            try:
                response = client.post(
                    EXPO_PUSH_URL,
                    headers={
                        "Accept": "application/json",
                        "Content-Type": "application/json",
                    },
                    json=batch,
                )
            except httpx.HTTPError as err:
                log.warning("Expo push request failed: %s", err)
                continue
            if response.status_code >= 400:
                log.warning(
                    "Expo push HTTP %s: %s",
                    response.status_code,
                    response.text[:300],
                )
                continue

            payload = response.json()
            tickets = payload.get("data") if isinstance(payload, dict) else payload
            if not isinstance(tickets, list):
                sent += len(batch)
                continue
            for index, ticket in enumerate(tickets):
                if not isinstance(ticket, dict):
                    continue
                if ticket.get("status") == "ok":
                    sent += 1
                    continue
                details = ticket.get("details") or {}
                error = ticket.get("message") or details.get("error")
                if error == "DeviceNotRegistered" or details.get("error") == "DeviceNotRegistered":
                    stale.append(batch[index]["to"])
                else:
                    log.warning("Expo push ticket error: %s", ticket)

    if stale:
        push_store.disable_tokens(stale)

    log.info("push notify: sent=%s tokens=%s stale=%s", sent, len(tokens), len(stale))
    return {"sent": sent, "tokens": len(tokens), "stale": len(stale)}
