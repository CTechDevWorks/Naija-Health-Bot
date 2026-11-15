"""
Retrieve malaria knowledge passages for a question.

When Supabase RAG is configured, the question is sent to the `rag-query` edge
function, which embeds it with gte-small and runs `match_kb_sections`. When it
is not configured, retrieval is off and the chat service answers without
passages (the previous behaviour).

The service holds the project's service_role key only on the server. It is
never sent to the mobile app.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from functools import lru_cache
from typing import Protocol

import httpx

from config import settings
from services.sources import load_sources

log = logging.getLogger("naija_health.retrieval")


@dataclass(frozen=True)
class Passage:
    id: str
    document_id: str
    heading: str
    content: str
    source_ids: tuple[str, ...]
    similarity: float


class RetrievalError(Exception):
    """Supabase could not be reached or refused the search."""


class Retriever(Protocol):
    def search(self, query: str) -> list[Passage]: ...


class SupabaseRetriever:
    def __init__(
        self,
        url: str,
        service_role_key: str,
        *,
        match_count: int,
        match_threshold: float,
        timeout_s: float = 30.0,
        client: httpx.Client | None = None,
    ) -> None:
        self._url = f"{url.rstrip('/')}/functions/v1/rag-query"
        self._key = service_role_key
        self._match_count = match_count
        self._match_threshold = match_threshold
        self._client = client or httpx.Client(timeout=timeout_s)

    def search(self, query: str) -> list[Passage]:
        try:
            response = self._client.post(
                self._url,
                headers={
                    "Authorization": f"Bearer {self._key}",
                    "apikey": self._key,
                    "Content-Type": "application/json",
                },
                json={
                    "query": query,
                    "match_count": self._match_count,
                    "match_threshold": self._match_threshold,
                },
            )
        except httpx.HTTPError as err:
            raise RetrievalError(f"could not reach rag-query: {type(err).__name__}") from err

        if response.status_code >= 400:
            raise RetrievalError(f"rag-query returned {response.status_code}")

        try:
            payload = response.json()
        except ValueError as err:
            raise RetrievalError("rag-query returned non-JSON") from err

        if isinstance(payload, dict) and payload.get("error"):
            raise RetrievalError(str(payload["error"]))

        rows = payload.get("passages") if isinstance(payload, dict) else payload
        if not isinstance(rows, list):
            raise RetrievalError("rag-query returned no passages list")

        approved = load_sources()
        passages: list[Passage] = []
        for row in rows:
            if not isinstance(row, dict):
                continue
            raw_ids = row.get("source_ids") or []
            source_ids = tuple(
                sid for sid in raw_ids if isinstance(sid, str) and sid in approved
            )
            content = (row.get("content") or "").strip()
            if not content:
                continue
            passages.append(
                Passage(
                    id=str(row.get("id") or ""),
                    document_id=str(row.get("document_id") or ""),
                    heading=str(row.get("heading") or ""),
                    content=content,
                    source_ids=source_ids,
                    similarity=float(row.get("similarity") or 0.0),
                )
            )
        return passages


class NullRetriever:
    """Used when RAG is not configured: search always returns nothing."""

    def search(self, query: str) -> list[Passage]:
        return []


@lru_cache(maxsize=1)
def _retriever() -> Retriever:
    if not settings.rag_configured:
        return NullRetriever()
    return SupabaseRetriever(
        settings.supabase_url,
        settings.supabase_service_role_key,
        match_count=settings.rag_match_count,
        match_threshold=settings.rag_match_threshold,
    )


def get_retriever() -> Retriever:
    return _retriever()


def passages_for_prompt(passages: list[Passage]) -> str:
    """Format retrieved passages for the system / user context."""
    if not passages:
        return ""
    blocks: list[str] = []
    for index, passage in enumerate(passages, start=1):
        sources = ", ".join(passage.source_ids) if passage.source_ids else "none"
        blocks.append(
            f"[{index}] (sources: {sources})\n{passage.content}"
        )
    return "\n\n".join(blocks)


def allowed_medicine_context(passages: list[Passage]) -> str:
    """Text the medicine-name check may treat as approved."""
    return "\n".join(passage.content for passage in passages)


def source_ids_from(passages: list[Passage]) -> list[str]:
    seen: list[str] = []
    for passage in passages:
        for sid in passage.source_ids:
            if sid not in seen:
                seen.append(sid)
    return seen
