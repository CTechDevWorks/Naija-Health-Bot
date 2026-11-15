"""
Runtime settings for the Kadet AI service.

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
    bluesminds_api_key: str = os.getenv("BLUESMINDS_API_KEY", "")
    bluesminds_base_url: str = os.getenv("BLUESMINDS_BASE_URL", "https://api.bluesminds.com/v1")
    # Primary model + ordered fallbacks. Benchmarked 2026-09-11: nemotron streams in ~4s,
    # gpt-oss-20b reasons for ~30s before its first token, gpt-5.5 was 504ing upstream.
    model: str = os.getenv("BLUESMINDS_MODEL", "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning")
    fallback_models: list[str] = field(
        default_factory=lambda: _csv(
            os.getenv("BLUESMINDS_FALLBACK_MODELS"),
            ["openai/gpt-oss-20b", "gpt-5.5"],
        )
    )
    temperature: float = _float("AI_TEMPERATURE", 0.4)
    max_output_tokens: int = _int("AI_MAX_OUTPUT_TOKENS", 1200)
    request_timeout_s: float = _float("AI_REQUEST_TIMEOUT_S", 90.0)

    # ── Flashcard generation ──
    # Benchmarked 2026-09-11 (20 atomic cards via tool call): gpt-oss-20b @ low
    # reasoning 12s; nemotron with thinking off 23s; nemotron default 100s+.
    flashcard_models: list[str] = field(
        default_factory=lambda: _csv(
            os.getenv("FLASHCARD_MODELS"),
            ["openai/gpt-oss-20b", "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning"],
        )
    )
    flashcard_max_cards: int = _int("FLASHCARD_MAX_CARDS", 50)
    flashcard_default_cards: int = _int("FLASHCARD_DEFAULT_CARDS", 20)
    flashcard_max_output_tokens: int = _int("FLASHCARD_MAX_OUTPUT_TOKENS", 9000)
    flashcard_timeout_s: float = _float("FLASHCARD_TIMEOUT_S", 55.0)
    flashcard_max_source_chars: int = _int("FLASHCARD_MAX_SOURCE_CHARS", 12000)

    # ── Mind maps (Study Canvas) ──
    mindmap_models: list[str] = field(
        default_factory=lambda: _csv(
            os.getenv("MINDMAP_MODELS"),
            ["openai/gpt-oss-20b", "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning"],
        )
    )
    mindmap_max_nodes: int = _int("MINDMAP_MAX_NODES", 50)
    mindmap_max_output_tokens: int = _int("MINDMAP_MAX_OUTPUT_TOKENS", 6000)
    mindmap_timeout_s: float = _float("MINDMAP_TIMEOUT_S", 55.0)
    mindmap_max_source_chars: int = _int("MINDMAP_MAX_SOURCE_CHARS", 12000)

    # ── Notes generation ──
    notes_models: list[str] = field(
        default_factory=lambda: _csv(
            os.getenv("NOTES_MODELS"),
            ["openai/gpt-oss-20b", "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning"],
        )
    )
    notes_max_output_tokens: int = _int("NOTES_MAX_OUTPUT_TOKENS", 8000)
    notes_timeout_s: float = _float("NOTES_TIMEOUT_S", 75.0)
    notes_max_source_chars: int = _int("NOTES_MAX_SOURCE_CHARS", 16000)

    # ── Conversation limits (guardrails) ──
    max_message_chars: int = _int("AI_MAX_MESSAGE_CHARS", 4000)
    max_history_messages: int = _int("AI_MAX_HISTORY_MESSAGES", 20)

    # ── Supabase auth (verifies the browser's access token) ──
    supabase_url: str = os.getenv("SUPABASE_URL", "").rstrip("/")
    # Legacy HS256 projects only. Leave empty for ES256/JWKS projects.
    supabase_jwt_secret: str = os.getenv("SUPABASE_JWT_SECRET", "")

    # ── Rate limiting (requests per window) ──
    auth_rate_limit: int = _int("RATE_LIMIT_AUTH", 20)
    auth_rate_window_s: int = _int("RATE_LIMIT_AUTH_WINDOW_S", 60)
    anon_rate_limit: int = _int("RATE_LIMIT_ANON", 5)
    anon_rate_window_s: int = _int("RATE_LIMIT_ANON_WINDOW_S", 60)

    # ── HTTP ──
    allowed_origins: list[str] = field(
        default_factory=lambda: _csv(
            os.getenv("ALLOWED_ORIGINS"),
            ["http://localhost:3000", "http://127.0.0.1:3000"],
        )
    )

    @property
    def prompts_dir(self) -> Path:
        return BASE_DIR / "prompts"


settings = Settings()
