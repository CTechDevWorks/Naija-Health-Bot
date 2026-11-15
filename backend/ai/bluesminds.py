"""
BluesMinds — OpenAI-compatible gateway (https://api.bluesminds.com/v1).

Uses the official `openai` client pointed at the gateway. The gateway fronts many
upstream providers and individual models go down / hit end-of-life, so every
call walks an ordered list of models and falls through on 4xx/5xx/timeouts.
"""

from __future__ import annotations

import logging

from openai import (
    APIConnectionError,
    APIStatusError,
    APITimeoutError,
    OpenAI,
    RateLimitError,
)

from .base import AIPlatform, AIPlatformError, Message

log = logging.getLogger("naija_health.ai.bluesminds")

# Gateway/upstream conditions worth retrying on the next model.
_FALLTHROUGH_STATUS = {404, 408, 409, 410, 425, 429, 500, 502, 503, 504}


class BluesMinds(AIPlatform):
    name = "bluesminds"

    def __init__(
        self,
        api_key: str,
        base_url: str,
        model: str,
        fallback_models: list[str] | None = None,
        temperature: float = 0.3,
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

    def _should_fall_through(self, err: Exception) -> bool:
        if isinstance(err, (APIConnectionError, APITimeoutError, RateLimitError)):
            return True
        if isinstance(err, APIStatusError):
            return err.status_code in _FALLTHROUGH_STATUS
        return False

    def chat(self, messages: list[Message]) -> tuple[str, str]:
        last: Exception | None = None
        for model in self.models:
            try:
                completion = self.client.chat.completions.create(
                    model=model,
                    messages=messages,
                    temperature=self.temperature,
                    max_tokens=self.max_output_tokens,
                )
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
