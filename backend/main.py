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
    GET  /api/v1/health → {"status": "ok", "provider": ..., "model": ..., "configured": bool}
    POST /api/v1/chat   → body {"messages": [{"role": "user" | "assistant", "content": "..."}]}
                          reply {"response": "...", "model": "...", "guardrail": str | null,
                                 "urgent": bool, "sources": [{"id", "title", "organisation", "url"}]}
    GET  /docs          → interactive API docs

The mobile app must reach the AI provider only through this service, so the API
key never ships inside the app.
"""

from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api import chat, health
from config import settings

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")

app = FastAPI(title="9ja Health AI", version="0.1.0", docs_url="/docs", redoc_url=None)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(health.router)
app.include_router(chat.router)


@app.get("/", include_in_schema=False)
def root() -> dict[str, str]:
    return {"message": "9ja Health AI service is running", "docs": "/docs"}
