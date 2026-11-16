"""Request / response models for the assistant API."""

from __future__ import annotations

from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field

Role = Literal["user", "assistant"]


class ChatMessage(BaseModel):
    """One turn of the conversation. Only user/assistant roles are accepted from
    the client — the system prompt is always injected server-side."""

    role: Role
    content: str = Field(min_length=1, max_length=20_000)


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(min_length=1, max_length=200)
    # Signed-in callers only: continue this saved conversation. Leave empty to
    # start a new one. Guests' requests ignore it.
    conversation_id: UUID | None = None


class Source(BaseModel):
    """An approved reference from `knowledge_base/sources.json`."""

    id: str
    title: str
    organisation: str
    url: str


class ChatResponse(BaseModel):
    response: str
    # The model that answered, or "guardrail" when a fixed reply was returned.
    model: str
    # Set when a server-side rule replaced or blocked the model's answer.
    guardrail: str | None = None
    # True when the message matched the emergency / self-harm keyword check.
    urgent: bool = False
    # References the model pointed to, limited to the approved list.
    sources: list[Source] = Field(default_factory=list)
    # The saved conversation this exchange was added to. None for guests, and
    # when saving failed.
    conversation_id: str | None = None
    # True only when this exchange was written to the caller's history.
    saved: bool = False


class ConversationSummary(BaseModel):
    id: str
    title: str
    updated_at: str


class StoredChatMessage(BaseModel):
    role: Role
    content: str
    urgent: bool = False
    guardrail: str | None = None
    sources: list[Source] = Field(default_factory=list)
    created_at: str | None = None


class ConversationDetail(ConversationSummary):
    messages: list[StoredChatMessage]


class HealthResponse(BaseModel):
    status: Literal["ok"]
    provider: str
    model: str
    # False until BLUESMINDS_API_KEY is set.
    configured: bool
    # False until SUPABASE_URL and SUPABASE_ANON_KEY are set; sign-in and saved
    # conversations are off until then.
    accounts: bool = False
    # False until SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set and the
    # knowledge base has been loaded; without this the assistant answers without
    # retrieved passages.
    rag: bool = False


class HealthReportSource(BaseModel):
    id: str
    slug: str
    name: str
    region: str | None = None


class HealthReportItem(BaseModel):
    id: str
    title: str
    summary: str
    original_url: str
    published_at: str
    ingested_at: str | None = None
    topic: str
    location_scope: str
    urgency: str
    is_ai_summary: bool = True
    source: HealthReportSource | None = None


class HealthReportListResponse(BaseModel):
    reports: list[HealthReportItem]
    count: int


class DailyUpdatesJobResponse(BaseModel):
    status: str
    triggered_for_date: str
    job_run_id: str | None = None
    items_fetched: int
    items_inserted: int
    items_skipped: int
    error_message: str | None = None


class PushTokenRequest(BaseModel):
    token: str = Field(min_length=20, max_length=200)
    platform: Literal["ios", "android", "web", "unknown"] | None = None
    enabled: bool = True


class PushTokenResponse(BaseModel):
    ok: bool = True
    enabled: bool


class PreventionRequest(BaseModel):
    """GPS + already-resolved Nigerian state from the mobile app."""

    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    state: str = Field(min_length=2, max_length=64)


class PreventionFactor(BaseModel):
    label: str
    detail: str


class PreventionTipItem(BaseModel):
    id: str
    title: str
    body: str
    group: str


class PreventionSource(BaseModel):
    id: str
    title: str
    organisation: str
    url: str


class PreventionResponse(BaseModel):
    state: str
    incidence_per_1000: float
    category: str
    period: str
    prediction_year: int
    feature_year: int
    factors: list[PreventionFactor]
    tips: list[PreventionTipItem]
    model_version: str
    updated_at: str
    sources: list[PreventionSource] = Field(default_factory=list)
    limitations: list[str] = Field(default_factory=list)
    disclaimer: str
