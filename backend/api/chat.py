"""POST /api/v1/chat — the health assistant."""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException

from ai.base import AIPlatform, AIPlatformError
from auth.dependencies import Identity, get_identity
from auth.throttling import apply_rate_limit
from config import settings
from guardrails import InvalidTranscript
from schemas import ChatRequest, ChatResponse
from services import chat_service
from services.history import (
    HistoryError,
    HistoryStore,
    StoredMessage,
    get_history_store,
    title_for,
)

from .deps import get_ai_platform

log = logging.getLogger("naija_health.api.chat")

router = APIRouter(prefix="/api/v1", tags=["assistant"])

GENERIC_FAILURE = (
    "The assistant could not answer just now. Please try again in a few seconds."
)
CONVERSATION_NOT_FOUND = "That conversation could not be found."


def _answer(platform: AIPlatform, history: list[dict]) -> ChatResponse:
    try:
        return chat_service.answer(platform, history)
    except InvalidTranscript as err:
        raise HTTPException(422, str(err)) from err
    except AIPlatformError as err:
        log.error("all models failed: %s", err)
        raise HTTPException(503, GENERIC_FAILURE) from err
    except Exception as err:  # noqa: BLE001 — never leak provider errors or stack traces
        log.exception("chat failed: %s", type(err).__name__)
        raise HTTPException(503, GENERIC_FAILURE) from err


# A plain `def` on purpose: the provider call blocks, so FastAPI runs this in a
# worker thread instead of stalling every other request.
@router.post("/chat", response_model=ChatResponse)
def chat(
    request: ChatRequest,
    identity: Identity = Depends(get_identity),
    platform: AIPlatform = Depends(get_ai_platform),
    store: HistoryStore | None = Depends(get_history_store),
) -> ChatResponse:
    apply_rate_limit(identity.key)

    sent = [m.model_dump() for m in request.messages]

    # Guests, and accounts that have not passed the second factor, get an answer
    # from the transcript they sent. Nothing is stored.
    if store is None or not identity.verified or identity.token is None:
        return _answer(platform, sent)

    return _answer_and_save(platform, store, identity.token, request, sent)


def _answer_and_save(
    platform: AIPlatform,
    store: HistoryStore,
    token: str,
    request: ChatRequest,
    sent: list[dict],
) -> ChatResponse:
    """
    For a verified account the saved conversation is the transcript: the model
    sees what is stored plus the new question, not what the client says was said
    earlier. That keeps the saved history and the model's context the same thing.
    """
    question = request.messages[-1]
    if question.role != "user":
        raise HTTPException(422, "The last message must come from the user.")
    new_turn = {"role": "user", "content": question.content}

    conversation_id = str(request.conversation_id) if request.conversation_id else None

    history = [new_turn]
    can_save = True
    if conversation_id:
        try:
            stored = store.get_messages(token, conversation_id)
        except HistoryError as err:
            # Still answer; the app is told this exchange was not saved.
            log.error("could not load a saved conversation: %s", err)
            history, can_save = sent, False
        else:
            if stored is None:
                raise HTTPException(404, CONVERSATION_NOT_FOUND)
            history = [{"role": m.role, "content": m.content} for m in stored] + [new_turn]

    reply = _answer(platform, history)
    if not can_save:
        return reply.model_copy(update={"conversation_id": conversation_id})

    try:
        if conversation_id is None:
            conversation_id = store.create_conversation(token, title_for(question.content)).id
        store.add_messages(
            token,
            conversation_id,
            [
                StoredMessage(
                    role="user",
                    content=question.content.strip()[: settings.max_message_chars],
                ),
                StoredMessage(
                    role="assistant",
                    content=reply.response,
                    urgent=reply.urgent,
                    guardrail=reply.guardrail,
                    sources=[s.model_dump() for s in reply.sources],
                ),
            ],
        )
    except HistoryError as err:
        log.error("could not save an exchange: %s", err)
        return reply.model_copy(update={"conversation_id": conversation_id})

    return reply.model_copy(update={"conversation_id": conversation_id, "saved": True})
