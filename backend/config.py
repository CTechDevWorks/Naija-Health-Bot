"""
Runtime settings for the 9ja Health AI service.

Everything is read from environment variables (a local `.env` next to this file
is loaded automatically). Nothing secret is ever hard-coded here.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")


def _csv(value: str | None, default: list[str]) -> list[str]:
    if not value:
        return default
    return [item.strip() for item in value.split(",") if item.strip()]


def _int(name: str, default: int) -> int:
    raw = os.getenv(name)
    try:
        return int(raw) if raw else default
    except ValueError:
        return default


def _float(name: str, default: float) -> float:
    raw = os.getenv(name)
    try:
        return float(raw) if raw else default
    except ValueError:
        return default


@dataclass(frozen=True)
class Settings:
    # ── BluesMinds (OpenAI-compatible gateway) ──
    # Blank key = the service still starts, but /api/v1/chat answers 503.
    bluesminds_api_key: str = os.getenv("BLUESMINDS_API_KEY", "")
    bluesminds_base_url: str = os.getenv("BLUESMINDS_BASE_URL", "https://api.bluesminds.com/v1")
    # Primary model + ordered fallbacks, tried in turn on gateway errors.
    model: str = os.getenv("BLUESMINDS_MODEL", "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning")
    fallback_models: list[str] = field(
        default_factory=lambda: _csv(
            os.getenv("BLUESMINDS_FALLBACK_MODELS"),
            ["openai/gpt-oss-20b", "gpt-5.5"],
        )
    )
    temperature: float = _float("AI_TEMPERATURE", 0.3)
    max_output_tokens: int = _int("AI_MAX_OUTPUT_TOKENS", 1200)
    request_timeout_s: float = _float("AI_REQUEST_TIMEOUT_S", 90.0)

    # ── Conversation limits (guardrails) ──
    max_message_chars: int = _int("AI_MAX_MESSAGE_CHARS", 4000)
    max_history_messages: int = _int("AI_MAX_HISTORY_MESSAGES", 20)

    # ── Supabase auth (optional) ──
    # The app needs no account today, so these stay blank and every caller is
    # anonymous. Fill them in if sign-in is added later.
    supabase_url: str = os.getenv("SUPABASE_URL", "").rstrip("/")
    # Legacy HS256 projects only. Leave empty for ES256/JWKS projects.
    supabase_jwt_secret: str = os.getenv("SUPABASE_JWT_SECRET", "")

    # ── Rate limiting (requests per window) ──
    auth_rate_limit: int = _int("RATE_LIMIT_AUTH", 20)
    auth_rate_window_s: int = _int("RATE_LIMIT_AUTH_WINDOW_S", 60)
    # Anonymous callers are counted per IP address. Mobile networks often put
    # many phones behind one address, so this is deliberately not too tight.
    anon_rate_limit: int = _int("RATE_LIMIT_ANON", 10)
    anon_rate_window_s: int = _int("RATE_LIMIT_ANON_WINDOW_S", 60)

    # ── HTTP ──
    # Native apps ignore CORS; these origins are for Expo web during development.
    allowed_origins: list[str] = field(
        default_factory=lambda: _csv(
            os.getenv("ALLOWED_ORIGINS"),
            ["http://localhost:8081", "http://127.0.0.1:8081"],
        )
    )

    @property
    def prompts_dir(self) -> Path:
        return BASE_DIR / "prompts"

    @property
    def sources_path(self) -> Path:
        return BASE_DIR / "knowledge_base" / "sources.json"


settings = Settings()
