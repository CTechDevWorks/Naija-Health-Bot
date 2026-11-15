"""
Saved conversations — signed-in accounts with two-factor sign-in only.

    GET    /api/v1/conversations        → the caller's conversations, newest first
    GET    /api/v1/conversations/{id}   → one conversation with its messages
    DELETE /api/v1/conversations/{id}   → delete one
    DELETE /api/v1/conversations        → delete all of the caller's history
"""

from __future__ import annotations

import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response

from auth.dependencies import Identity, require_account
from auth.throttling import apply_rate_limit
from schemas import ConversationDetail, ConversationSummary, StoredChatMessage
from services.history import HistoryAuthError, HistoryError, HistoryStore, get_history_store

log = logging.getLogger("naija_health.api.conversations")

router = APIRouter(prefix="/api/v1/conversations", tags=["history"])

NOT_CONFIGURED = "Saved conversations are not set up on this server yet."
UNAVAILABLE = "Saved conversations are unavailable just now. Please try again shortly."
NOT_FOUND = "That conversation could not be found."
SESSION_REFUSED = "Your session is no longer valid. Please sign in again."


def _store(store: HistoryStore | None = Depends(get_history_store)) -> HistoryStore:
    if store is None:
        raise HTTPException(503, NOT_CONFIGURED)
    return store


def _account(identity: Identity = Depends(require_account)) -> Identity:
    apply_rate_limit(identity.key, bucket="history")
    return identity


def _failed(err: HistoryError) -> HTTPException:
    if isinstance(err, HistoryAuthError):
        return HTTPException(401, SESSION_REFUSED)
    log.error("history request failed: %s", err)
    return HTTPException(503, UNAVAILABLE)


@router.get("", response_model=list[ConversationSummary])
def list_conversations(
    identity: Identity = Depends(_account),
    store: HistoryStore = Depends(_store),
) -> list[ConversationSummary]:
    try:
        rows = store.list_conversations(identity.token or "")
    except HistoryError as err:
        raise _failed(err) from err
    return [ConversationSummary(id=r.id, title=r.title, updated_at=r.updated_at) for r in rows]


@router.get("/{conversation_id}", response_model=ConversationDetail)
def get_conversation(
    conversation_id: UUID,
    identity: Identity = Depends(_account),
    store: HistoryStore = Depends(_store),
) -> ConversationDetail:
    token = identity.token or ""
    try:
        conversation = store.get_conversation(token, str(conversation_id))
        messages = store.get_messages(token, str(conversation_id)) if conversation else None
    except HistoryError as err:
        raise _failed(err) from err
    if conversation is None or messages is None:
        raise HTTPException(404, NOT_FOUND)

    return ConversationDetail(
        id=conversation.id,
        title=conversation.title,
        updated_at=conversation.updated_at,
        messages=[
            StoredChatMessage(
                role=m.role,  # type: ignore[arg-type]
                content=m.content,
                urgent=m.urgent,
                guardrail=m.guardrail,
                sources=m.sources,  # type: ignore[arg-type]
                created_at=m.created_at,
            )
            for m in messages
        ],
    )


@router.delete("/{conversation_id}", status_code=204)
def delete_conversation(
    conversation_id: UUID,
    identity: Identity = Depends(_account),
    store: HistoryStore = Depends(_store),
) -> Response:
    try:
        deleted = store.delete_conversation(identity.token or "", str(conversation_id))
    except HistoryError as err:
        raise _failed(err) from err
    if not deleted:
        raise HTTPException(404, NOT_FOUND)
    return Response(status_code=204)


@router.delete("", status_code=204)
def delete_all_conversations(
    identity: Identity = Depends(_account),
    store: HistoryStore = Depends(_store),
) -> Response:
    try:
        store.delete_all(identity.token or "")
    except HistoryError as err:
        raise _failed(err) from err
    return Response(status_code=204)
