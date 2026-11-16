"""
9ja Health — AI assistant service (FastAPI).

Set up once, from this folder:
    python -m venv .venv
    .venv\\Scripts\\activate            (macOS/Linux: source .venv/bin/activate)
    pip install -r requirements-dev.txt
    copy .env.example .env             (then fill in BLUESMINDS_API_KEY)

Run from this folder:
    uvicorn main:app --reload --port 8000

Test from this folder:
    pytest

Endpoints
    GET  /api/v1/health → {"status": "ok", "provider": ..., "model": ..., "configured": bool,
                           "accounts": bool}
    POST /api/v1/prevention → body {"latitude", "longitude", "state"}
                              area-level malaria incidence estimate + tips
    POST /api/v1/chat   → body {"messages": [{"role": "user" | "assistant", "content": "..."}],
                                "conversation_id": uuid | null}
                          reply {"response": "...", "model": "...", "guardrail": str | null,
                                 "urgent": bool, "sources": [{"id", "title", "organisation", "url"}],
                                 "conversation_id": str | null, "saved": bool}
    GET    /api/v1/conversations       → the signed-in user's saved conversations
    GET    /api/v1/conversations/{id}  → one conversation with its messages
    DELETE /api/v1/conversations/{id}  → delete one
    DELETE /api/v1/conversations       → delete all of them
    GET  /api/v1/health-reports        → published official health updates
    POST /api/v1/jobs/daily-health-updates → scrape → AI summarise → Supabase
    POST /api/v1/push-tokens           → register / disable Expo push tokens
    GET  /docs          → interactive API docs

Sign-in is optional. Without a token the chat works and nothing is saved. Saved
conversations need a Supabase token from a two-factor sign-in (see auth/).

Malaria answers are grounded in `knowledge_base/RAGInfo/` once RAG is configured
(see supabase/README.md). Without it the assistant still answers, but without
retrieved passages.

The mobile app must reach the AI provider only through this service, so the API
key never ships inside the app.
"""

from __future__ import annotations

import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api import chat, conversations, health, prevention, push, reports
from config import settings
from ml.malaria_model import load_malaria_model
from services.daily_scheduler import start_daily_scheduler
from services.keep_alive import start_keep_alive

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    load_malaria_model()
    keep_alive = start_keep_alive()
    daily_updates = start_daily_scheduler()
    yield
    if daily_updates:
        daily_updates.cancel()
    if keep_alive:
        keep_alive.cancel()


app = FastAPI(
    title="9ja Health AI",
    version="0.1.0",
    docs_url="/docs",
    redoc_url=None,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Authorization", "Content-Type", "X-Job-Secret"],
)

app.include_router(health.router)
app.include_router(prevention.router)
app.include_router(chat.router)
app.include_router(conversations.router)
app.include_router(reports.router)
app.include_router(push.router)


@app.get("/", include_in_schema=False)
def root() -> dict[str, str]:
    return {"message": "9ja Health AI service is running", "docs": "/docs"}
