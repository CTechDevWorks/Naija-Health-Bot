"""
Saved conversations, stored in Supabase Postgres.

The service talks to Supabase's REST API with the caller's own access token and
the project's public (anon) key. It holds no privileged key: row-level security
in the database (see `supabase/chat_history.sql`) is what limits each user to their
own rows, and those policies also require two-factor sign-in.

Limits worth knowing:
  * Message text is stored as plain text. Anyone with database access to the
    Supabase project can read it.
  * Because writes use the user's own token, a user who calls Supabase directly
    could insert rows into their own history that this service never produced.
    They cannot touch anyone else's.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from functools import lru_cache
from typing import Any

import httpx

from config import settings

log = logging.getLogger("naija_health.history")

TITLE_MAX_CHARS = 60
MAX_CONVERSATIONS_LISTED = 50
MAX_MESSAGES_LOADED = 200


class HistoryError(Exception):
    """Supabase could not be reached or refused the request."""


class HistoryAuthError(HistoryError):
    """Supabase rejected the caller's token (expired or not allowed)."""


@dataclass(frozen=True)
class Conversation:
    id: str
    title: str
    updated_at: str


@dataclass(frozen=True)
class StoredMessage:
    role: str
    content: str
    urgent: bool = False
    guardrail: str | None = None
    sources: list[dict[str, Any]] = field(default_factory=list)
    created_at: str | None = None


def title_for(question: str) -> str:
    """A short label for a conversation, taken from its first question."""
    text = " ".join(question.split())
    if len(text) <= TITLE_MAX_CHARS:
        return text or "Conversation"
    return text[: TITLE_MAX_CHARS - 1].rstrip() + "…"


class HistoryStore:
    """Interface the routes depend on; `SupabaseHistory` is the real one."""

    def list_conversations(self, token: str) -> list[Conversation]:
        raise NotImplementedError

    def create_conversation(self, token: str, title: str) -> Conversation:
        raise NotImplementedError

    def get_messages(self, token: str, conversation_id: str) -> list[StoredMessage] | None:
        """Messages oldest first, or None when the caller has no such conversation."""
        raise NotImplementedError

    def get_conversation(self, token: str, conversation_id: str) -> Conversation | None:
        raise NotImplementedError

    def add_messages(self, token: str, conversation_id: str, messages: list[StoredMessage]) -> None:
        raise NotImplementedError

    def delete_conversation(self, token: str, conversation_id: str) -> bool:
        """True when a conversation was deleted."""
        raise NotImplementedError

    def delete_all(self, token: str) -> None:
        raise NotImplementedError


class SupabaseHistory(HistoryStore):
    def __init__(
        self,
        url: str,
        anon_key: str,
        timeout_s: float = 10.0,
        client: httpx.Client | None = None,
    ) -> None:
        self._rest = f"{url.rstrip('/')}/rest/v1"
        self._anon_key = anon_key
        self._client = client or httpx.Client(timeout=timeout_s)

    def _request(
        self,
        method: str,
        table: str,
        token: str,
        *,
        params: dict[str, str] | None = None,
        json: Any = None,
        prefer: str | None = None,
    ) -> Any:
        headers = {"apikey": self._anon_key, "Authorization": f"Bearer {token}"}
        if prefer:
            headers["Prefer"] = prefer
        try:
            response = self._client.request(
                method, f"{self._rest}/{table}", params=params, json=json, headers=headers
            )
        except httpx.HTTPError as err:
            raise HistoryError(f"could not reach Supabase: {type(err).__name__}") from err

        if response.status_code in (401, 403):
            raise HistoryAuthError(f"Supabase refused the token ({response.status_code})")
        if response.status_code >= 400:
            # Supabase's error body can echo row data; log the code only.
            raise HistoryError(f"Supabase returned {response.status_code} for {method} {table}")
        if not response.content:
            return None
        return response.json()

    def list_conversations(self, token: str) -> list[Conversation]:
        rows = self._request(
            "GET",
            "conversations",
            token,
            params={
                "select": "id,title,updated_at",
                "order": "updated_at.desc",
                "limit": str(MAX_CONVERSATIONS_LISTED),
            },
        )
        return [Conversation(**row) for row in rows or []]

    def create_conversation(self, token: str, title: str) -> Conversation:
        # user_id is filled in by the database from the token, never sent from here.
        rows = self._request(
            "POST",
            "conversations",
            token,
            params={"select": "id,title,updated_at"},
            json={"title": title},
            prefer="return=representation",
        )
        if not rows:
            raise HistoryError("Supabase did not return the new conversation")
        return Conversation(**rows[0])

    def get_conversation(self, token: str, conversation_id: str) -> Conversation | None:
        rows = self._request(
            "GET",
            "conversations",
            token,
            params={"select": "id,title,updated_at", "id": f"eq.{conversation_id}", "limit": "1"},
        )
        return Conversation(**rows[0]) if rows else None

    def get_messages(self, token: str, conversation_id: str) -> list[StoredMessage] | None:
        if self.get_conversation(token, conversation_id) is None:
            return None
        rows = self._request(
            "GET",
            "messages",
            token,
            params={
                "select": "role,content,urgent,guardrail,sources,created_at",
                "conversation_id": f"eq.{conversation_id}",
                # Newest first so the limit keeps the latest turns; reversed below.
                "order": "id.desc",
                "limit": str(MAX_MESSAGES_LOADED),
            },
        )
        return [StoredMessage(**row) for row in reversed(rows or [])]

    def add_messages(self, token: str, conversation_id: str, messages: list[StoredMessage]) -> None:
        self._request(
            "POST",
            "messages",
            token,
            json=[
                {
                    "conversation_id": conversation_id,
                    "role": message.role,
                    "content": message.content,
                    "urgent": message.urgent,
                    "guardrail": message.guardrail,
                    "sources": message.sources,
                }
                for message in messages
            ],
            prefer="return=minimal",
        )

    def delete_conversation(self, token: str, conversation_id: str) -> bool:
        rows = self._request(
            "DELETE",
            "conversations",
            token,
            params={"id": f"eq.{conversation_id}", "select": "id"},
            prefer="return=representation",
        )
        return bool(rows)

    def delete_all(self, token: str) -> None:
        # PostgREST refuses a DELETE with no filter; row-level security still
        # limits this to the caller's own conversations.
        self._request(
            "DELETE",
            "conversations",
            token,
            params={"id": "not.is.null"},
            prefer="return=minimal",
        )


@lru_cache(maxsize=1)
def _store() -> HistoryStore | None:
    if not settings.supabase_url or not settings.supabase_anon_key:
        return None
    return SupabaseHistory(settings.supabase_url, settings.supabase_anon_key)


def get_history_store() -> HistoryStore | None:
    """The history store, or None while Supabase is not configured."""
    return _store()
