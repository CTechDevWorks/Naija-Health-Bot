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
# Local `.env` wins over any leftover process values (e.g. short test stubs in
# an IDE-integrated shell). Deployed hosts still set real secrets in the
# environment and typically have no `.env` file.
load_dotenv(BASE_DIR / ".env", override=True)


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

    # ── Supabase (accounts and saved conversations) ──
    # Sign-in is optional in the app. While these are blank every caller is a
    # guest: the chat works, nothing is saved, and a request that does carry a
    # token is refused.
    supabase_url: str = os.getenv("SUPABASE_URL", "").rstrip("/")
    # The project's public "anon" / publishable key. It is not a secret (the app
    # ships it too); the service sends it with the user's own token so that the
    # database's row-level security decides what each user can reach.
    supabase_anon_key: str = os.getenv("SUPABASE_ANON_KEY", "")
    # Server only. Used to load the knowledge base and to call the RAG edge
    # functions. Never put this in the mobile app.
    supabase_service_role_key: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    # Legacy HS256 projects only. Leave empty for ES256/JWKS projects.
    supabase_jwt_secret: str = os.getenv("SUPABASE_JWT_SECRET", "")

    # ── RAG (retrieval) ──
    # How close a passage must be to the question (cosine similarity, 0–1).
    rag_match_threshold: float = _float("RAG_MATCH_THRESHOLD", 0.5)
    # How many passages to give the model.
    rag_match_count: int = _int("RAG_MATCH_COUNT", 4)

    # ── Rate limiting (requests per window) ──
    auth_rate_limit: int = _int("RATE_LIMIT_AUTH", 20)
    auth_rate_window_s: int = _int("RATE_LIMIT_AUTH_WINDOW_S", 60)
    # Anonymous callers are counted per IP address. Mobile networks often put
    # many phones behind one address, so this is deliberately not too tight.
    anon_rate_limit: int = _int("RATE_LIMIT_ANON", 10)
    anon_rate_window_s: int = _int("RATE_LIMIT_ANON_WINDOW_S", 60)
    # Listing, opening and deleting saved conversations (signed-in only), per
    # RATE_LIMIT_AUTH_WINDOW_S.
    history_rate_limit: int = _int("RATE_LIMIT_HISTORY", 60)

    # ── HTTP ──
    # Native apps ignore CORS; these origins are for Expo web during development.
    allowed_origins: list[str] = field(
        default_factory=lambda: _csv(
            os.getenv("ALLOWED_ORIGINS"),
            ["http://localhost:8081", "http://127.0.0.1:8081"],
        )
    )

    # ── Keep-alive (free hosting) ──
    # Render sets RENDER_EXTERNAL_URL itself, so this is blank when run locally.
    public_url: str = os.getenv("RENDER_EXTERNAL_URL", "").rstrip("/")
    # Seconds between self-pings; must stay under Render's 15-minute idle limit.
    # 0 turns the keep-alive off.
    keep_alive_interval_s: int = _int("KEEP_ALIVE_INTERVAL_S", 300)

    # ── Daily health-updates scheduler (07:00 Africa/Lagos) ──
    # Blank = on when RENDER_EXTERNAL_URL is set, off locally.
    # Set to 1/0 to force on/off.
    updates_scheduler_enabled: str = os.getenv("UPDATES_SCHEDULER_ENABLED", "")
    # How many AI write-ups to publish per daily run / show in the app feed.
    updates_feed_limit: int = _int("UPDATES_FEED_LIMIT", 5)

    @property
    def accounts_configured(self) -> bool:
        """True once sign-in tokens can be verified and history can be stored."""
        return bool(self.supabase_url and self.supabase_anon_key)

    @property
    def rag_configured(self) -> bool:
        """True once the knowledge search edge function can be called."""
        return bool(self.supabase_url and self.supabase_service_role_key)

    @property
    def prompts_dir(self) -> Path:
        return BASE_DIR / "prompts"

    @property
    def sources_path(self) -> Path:
        return BASE_DIR / "knowledge_base" / "sources.json"

    @property
    def medicine_names_path(self) -> Path:
        return BASE_DIR / "knowledge_base" / "medicine_names.json"

    @property
    def rag_documents_dir(self) -> Path:
        return BASE_DIR / "knowledge_base" / "RAGInfo" / "documents"


settings = Settings()
