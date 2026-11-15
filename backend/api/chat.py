"""POST /api/v1/chat — the health assistant."""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException

from ai.base import AIPlatform, AIPlatformError
from auth.dependencies import get_user_identifier
from auth.throttling import apply_rate_limit
from guardrails import InvalidTranscript
from schemas import ChatRequest, ChatResponse
from services import chat_service

from .deps import get_ai_platform

log = logging.getLogger("naija_health.api.chat")

router = APIRouter(prefix="/api/v1", tags=["assistant"])

GENERIC_FAILURE = (
    "The assistant could not answer just now. Please try again in a few seconds."
)


# A plain `def` on purpose: the provider call blocks, so FastAPI runs this in a
# worker thread instead of stalling every other request.
@router.post("/chat", response_model=ChatResponse)
def chat(
    request: ChatRequest,
    user_id: str = Depends(get_user_identifier),
    platform: AIPlatform = Depends(get_ai_platform),
) -> ChatResponse:
    apply_rate_limit(user_id)

    try:
        return chat_service.answer(platform, [m.model_dump() for m in request.messages])
    except InvalidTranscript as err:
        raise HTTPException(422, str(err)) from err
    except AIPlatformError as err:
        log.error("all models failed: %s", err)
        raise HTTPException(503, GENERIC_FAILURE) from err
    except Exception as err:  # noqa: BLE001 — never leak provider errors or stack traces
        log.exception("chat failed: %s", type(err).__name__)
        raise HTTPException(503, GENERIC_FAILURE) from err
