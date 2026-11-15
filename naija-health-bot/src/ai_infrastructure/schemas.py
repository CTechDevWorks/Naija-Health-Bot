"""Request / response models for the chat API."""

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


class ChatResponse(BaseModel):
    response: str
    model: str
    guardrail: str | None = None


class HealthResponse(BaseModel):
    status: Literal["ok"]
    model: str
    provider: str
