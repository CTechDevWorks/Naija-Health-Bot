"""
Kadet AI — chat service (FastAPI).

Run from this folder:
    uvicorn main:app --reload --port 8000

Endpoints
    GET  /health        → provider + model in use
    POST /chat          → one JSON reply           {"messages": [...]}
    POST /chat/stream   → NDJSON stream of deltas  {"messages": [...]}
                          lines: {"delta": "..."} | {"guardrail": "..."} | {"error": "..."} | {"done": true, "model": "..."}
    POST /flashcards/generate → {"kind": "deck", "deck": {...}, "model": "..."}
    POST /canvas/ask          → {"kind": "reply", "message": "..."}
    POST /canvas/mindmap      → {"kind": "mindmap", "map": {...}} | clarify | refused
                              | {"kind": "clarify", "message": "..."}
                              | {"kind": "refused", "message": "..."}
                          Signed-in users only. The deck is validated server-side
                          (≤ 50 cards, non-empty faces, duplicates dropped).
    POST /canvas/mindmap     → {"kind": "mindmap", "mindmap": {...}} | clarify | refused
    POST /canvas/ask         → {"kind": "reply", "message": "..."} | refused

The browser never talks to this service directly — the Next.js routes
`/api/chat`, `/api/flashcards/generate`, `/api/canvas/mindmap` and
`/api/canvas/ask` proxy to it and forward the user's Supabase access token.
"""

from __future__ import annotations

import json
import logging
from collections.abc import Iterator

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from ai.base import AIPlatformError
from ai.bluesminds import BluesMinds
from auth.dependencies import ANONYMOUS_USER, get_user_identifier
from auth.throttling import apply_rate_limit
from config import settings
from flashcards import GenerateRequest, generate_deck
from flashcards.service import GenerationFailed
from guardrails import build_conversation, screen_input
from mindmaps import AskRequest, GenerateMindmapRequest, generate_mindmap
from mindmaps.service import GenerationFailed as MindmapFailed
from mindmaps.service import answer_canvas
from notes import GenerateNotesRequest, generate_notes
from notes.service import GenerationFailed as NotesFailed
from schemas import ChatRequest, ChatResponse, HealthResponse

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
log = logging.getLogger("kadet.api")

# ── App ─────────────────────────────────────────────────────────────────

app = FastAPI(title="Kadet AI", version="0.2.0", docs_url="/docs", redoc_url=None)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)

ai_platform = BluesMinds(
    api_key=settings.bluesminds_api_key,
    base_url=settings.bluesminds_base_url,
    model=settings.model,
    fallback_models=settings.fallback_models,
    temperature=settings.temperature,
    max_output_tokens=settings.max_output_tokens,
    timeout_s=settings.request_timeout_s,
)

GENERIC_FAILURE = (
    "Kadet lost signal for a moment — the AI service didn't respond. "
    "Please try again in a few seconds."
)


# ── Helpers ─────────────────────────────────────────────────────────────


def _prepare(request: ChatRequest, user_id: str):
    """Rate-limit, sanitise and screen. Returns (messages, guardrail_reply | None)."""
    apply_rate_limit(user_id)

    try:
        messages = build_conversation([m.model_dump() for m in request.messages])
    except ValueError as err:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, str(err)) from err

    verdict = screen_input(messages[-1]["content"])
    if verdict.blocked:
        log.info("guardrail %s triggered for %s", verdict.label, user_id)
        return messages, verdict
    return messages, None


def _ndjson(payload: dict) -> str:
    return json.dumps(payload, ensure_ascii=False) + "\n"


# ── Routes ──────────────────────────────────────────────────────────────


@app.get("/", include_in_schema=False)
async def root():
    return {"message": "Kadet AI service is running", "docs": "/docs"}


@app.get("/health", response_model=HealthResponse)
async def health():
    return HealthResponse(status="ok", model=ai_platform.model, provider=ai_platform.name)


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, user_id: str = Depends(get_user_identifier)):
    messages, verdict = _prepare(request, user_id)
    if verdict:
        return ChatResponse(response=verdict.reply or "", model="guardrail", guardrail=verdict.label)

    try:
        text, model = ai_platform.chat(messages)
    except AIPlatformError as err:
        log.error("all models failed: %s", err)
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, GENERIC_FAILURE) from err
    return ChatResponse(response=text, model=model)


@app.post("/chat/stream")
async def chat_stream(request: ChatRequest, user_id: str = Depends(get_user_identifier)):
    messages, verdict = _prepare(request, user_id)

    def generate() -> Iterator[str]:
        if verdict:
            yield _ndjson({"guardrail": verdict.label, "delta": verdict.reply})
            yield _ndjson({"done": True, "model": "guardrail"})
            return

        model_used = ai_platform.model
        try:
            for delta, model in ai_platform.stream(messages):
                model_used = model
                yield _ndjson({"delta": delta})
            yield _ndjson({"done": True, "model": model_used})
        except AIPlatformError as err:
            log.error("all models failed: %s", err)
            yield _ndjson({"error": GENERIC_FAILURE})
        except Exception as err:  # noqa: BLE001 — never leak stack traces to the client
            log.exception("stream failed mid-way: %s", err)
            yield _ndjson({"error": GENERIC_FAILURE})

    return StreamingResponse(
        generate(),
        media_type="application/x-ndjson",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.post("/flashcards/generate")
async def flashcards_generate(request: GenerateRequest, user_id: str = Depends(get_user_identifier)):
    """Generate a flashcard deck (or a clarifying question) via the tool-calling model."""
    if user_id == ANONYMOUS_USER:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Sign in to generate flashcards.")
    apply_rate_limit(user_id)

    try:
        result = generate_deck(ai_platform, request, user_id)
    except GenerationFailed as err:
        log.error("flashcard generation failed: %s", err)
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, GENERIC_FAILURE) from err
    except Exception as err:  # noqa: BLE001 — never leak stack traces
        log.exception("flashcard generation crashed: %s", err)
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, GENERIC_FAILURE) from err
    # omit JSON-null optional fields (hint/explanation) so the browser Zod check
    # doesn't reject a perfectly good deck
    return result.model_dump(exclude_none=True)


@app.post("/canvas/mindmap")
async def canvas_mindmap(request: GenerateMindmapRequest, user_id: str = Depends(get_user_identifier)):
    """Create a structured mind map (or a clarifying question) via create_mindmap."""
    if user_id == ANONYMOUS_USER:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Sign in to generate a mind map.")
    apply_rate_limit(user_id)
    try:
        result = generate_mindmap(ai_platform, request, user_id)
    except MindmapFailed as err:
        log.error("mindmap generation failed: %s", err)
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, GENERIC_FAILURE) from err
    except Exception as err:  # noqa: BLE001
        log.exception("mindmap generation crashed: %s", err)
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, GENERIC_FAILURE) from err
    return result.model_dump(exclude_none=True)


@app.post("/canvas/ask")
async def canvas_ask(request: AskRequest, user_id: str = Depends(get_user_identifier)):
    """Answer a canvas question using selected-node context."""
    if user_id == ANONYMOUS_USER:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Sign in to ask Kadet on the canvas.")
    apply_rate_limit(user_id)
    try:
        result = answer_canvas(ai_platform, request, user_id)
    except MindmapFailed as err:
        log.error("canvas ask failed: %s", err)
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, GENERIC_FAILURE) from err
    except Exception as err:  # noqa: BLE001
        log.exception("canvas ask crashed: %s", err)
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, GENERIC_FAILURE) from err
    return result.model_dump(exclude_none=True)


@app.post("/notes/generate")
async def notes_generate(request: GenerateNotesRequest, user_id: str = Depends(get_user_identifier)):
    """Generate structured study notes using the full BlockNote block set."""
    if user_id == ANONYMOUS_USER:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Sign in to generate notes.")
    apply_rate_limit(user_id)
    try:
        result = generate_notes(ai_platform, request, user_id)
    except NotesFailed as err:
        log.error("notes generation failed: %s", err)
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, GENERIC_FAILURE) from err
    except Exception as err:  # noqa: BLE001
        log.exception("notes generation crashed: %s", err)
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, GENERIC_FAILURE) from err
    return result.model_dump(exclude_none=True)
