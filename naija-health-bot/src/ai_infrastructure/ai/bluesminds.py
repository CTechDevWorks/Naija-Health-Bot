"""
BluesMinds — OpenAI-compatible gateway (https://api.bluesminds.com/v1).

Uses the official `openai` client pointed at the gateway. The gateway fronts many
upstream providers and individual models go down / hit end-of-life, so every
call walks an ordered list of models and falls through on 4xx/5xx/timeouts.
"""

from __future__ import annotations

import logging
from collections.abc import Iterator
from dataclasses import dataclass, field

from openai import (
    APIConnectionError,
    APIStatusError,
    APITimeoutError,
    OpenAI,
    RateLimitError,
)

from .base import AIPlatform, AIPlatformError, Message

log = logging.getLogger("kadet.ai.bluesminds")

# Gateway/upstream conditions worth retrying on the next model.
_FALLTHROUGH_STATUS = {404, 408, 409, 410, 425, 429, 500, 502, 503, 504}


@dataclass
class ToolCall:
    name: str
    arguments: str  # raw JSON string exactly as the model produced it


@dataclass
class ToolResult:
    content: str
    tool_calls: list[ToolCall] = field(default_factory=list)
    model: str = ""


class BluesMinds(AIPlatform):
    name = "bluesminds"

    def __init__(
        self,
        api_key: str,
        base_url: str,
        model: str,
        fallback_models: list[str] | None = None,
        temperature: float = 0.4,
        max_output_tokens: int = 1200,
        timeout_s: float = 90.0,
    ) -> None:
        if not api_key:
            raise ValueError("BLUESMINDS_API_KEY is not set.")
        self.client = OpenAI(api_key=api_key, base_url=base_url, timeout=timeout_s, max_retries=0)
        self.model = model
        self.models = [model, *[m for m in (fallback_models or []) if m != model]]
        self.temperature = temperature
        self.max_output_tokens = max_output_tokens

    # ── helpers ──────────────────────────────────────────────────────────

    def _should_fall_through(self, err: Exception) -> bool:
        if isinstance(err, (APIConnectionError, APITimeoutError, RateLimitError)):
            return True
        if isinstance(err, APIStatusError):
            return err.status_code in _FALLTHROUGH_STATUS
        return False

    def _params(self, model: str, messages: list[Message]) -> dict:
        return {
            "model": model,
            "messages": messages,
            "temperature": self.temperature,
            "max_tokens": self.max_output_tokens,
        }

    # ── AIPlatform ───────────────────────────────────────────────────────

    def chat(self, messages: list[Message]) -> tuple[str, str]:
        last: Exception | None = None
        for model in self.models:
            try:
                completion = self.client.chat.completions.create(**self._params(model, messages))
                text = (completion.choices[0].message.content or "").strip()
                if text:
                    return text, model
                log.warning("model %s returned empty content — trying next", model)
            except Exception as err:  # noqa: BLE001 — we classify below
                last = err
                if not self._should_fall_through(err):
                    raise
                log.warning("model %s failed (%s) — trying next", model, type(err).__name__)
        raise AIPlatformError("All configured models failed.") from last

    def call_with_tools(
        self,
        messages: list[Message],
        tools: list[dict],
        *,
        models: list[str] | None = None,
        tool_choice: str | dict = "auto",
        temperature: float | None = None,
        max_tokens: int | None = None,
        model_extras: dict[str, dict] | None = None,
        timeout_s: float | None = None,
    ) -> ToolResult:
        """
        One non-streaming completion with function-calling enabled.

        Walks `models` (default: the chat model list) and falls through on gateway
        errors exactly like `chat`. A model that returns neither text nor a tool
        call is treated as a failure so the next one gets a go.

        `model_extras` maps model id → extra request params (sent via extra_body),
        e.g. {"openai/gpt-oss-20b": {"reasoning_effort": "low"}}.
        """
        last: Exception | None = None
        for model in models or self.models:
            params = self._params(model, messages)
            params["tools"] = tools
            params["tool_choice"] = tool_choice
            if temperature is not None:
                params["temperature"] = temperature
            if max_tokens is not None:
                params["max_tokens"] = max_tokens
            extras = (model_extras or {}).get(model)
            if extras:
                params["extra_body"] = extras
            if timeout_s is not None:
                params["timeout"] = timeout_s
            try:
                completion = self.client.chat.completions.create(**params)
                msg = completion.choices[0].message
                calls = [
                    ToolCall(name=tc.function.name, arguments=tc.function.arguments or "")
                    for tc in (msg.tool_calls or [])
                    if getattr(tc, "function", None) is not None
                ]
                content = (msg.content or "").strip()
                if calls or content:
                    return ToolResult(content=content, tool_calls=calls, model=model)
                log.warning("model %s returned neither text nor a tool call — trying next", model)
            except Exception as err:  # noqa: BLE001 — classified below
                last = err
                if not self._should_fall_through(err):
                    raise
                log.warning("model %s failed (%s) — trying next", model, type(err).__name__)
        raise AIPlatformError("All configured models failed.") from last

    def stream(self, messages: list[Message]) -> Iterator[tuple[str, str]]:
        last: Exception | None = None
        for model in self.models:
            emitted = False
            try:
                stream = self.client.chat.completions.create(
                    **self._params(model, messages), stream=True
                )
                for chunk in stream:
                    if not chunk.choices:
                        continue
                    delta = chunk.choices[0].delta
                    # Reasoning models emit `reasoning_content` first; we only surface the answer.
                    text = getattr(delta, "content", None)
                    if text:
                        emitted = True
                        yield text, model
                if emitted:
                    return
                log.warning("model %s streamed no content — trying next", model)
            except Exception as err:  # noqa: BLE001
                last = err
                # Once tokens reached the client we can't transparently switch models.
                if emitted or not self._should_fall_through(err):
                    raise
                log.warning("model %s failed (%s) — trying next", model, type(err).__name__)
        raise AIPlatformError("All configured models failed.") from last
