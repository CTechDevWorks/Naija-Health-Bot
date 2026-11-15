"""Request / response models for the assistant API."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

Role = Literal["user", "assistant"]


class ChatMessage(BaseModel):
    """One turn of the conversation. Only user/assistant roles are accepted from
    the client — the system prompt is always injected server-side."""

    role: Role
    content: str = Field(min_length=1, max_length=20_000)


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(min_length=1, max_length=200)


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


class HealthResponse(BaseModel):
    status: Literal["ok"]
    provider: str
    model: str
    # False until BLUESMINDS_API_KEY is set.
    configured: bool
