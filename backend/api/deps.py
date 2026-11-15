"""Shared route dependencies."""

from __future__ import annotations

from functools import lru_cache

from fastapi import HTTPException

from ai.base import AIPlatform
from ai.bluesminds import BluesMinds
from config import settings


@lru_cache(maxsize=1)
def _platform() -> AIPlatform | None:
    """The configured AI provider, or None while no API key is set."""
    if not settings.bluesminds_api_key:
        return None
    return BluesMinds(
        api_key=settings.bluesminds_api_key,
        base_url=settings.bluesminds_base_url,
        model=settings.model,
        fallback_models=settings.fallback_models,
        temperature=settings.temperature,
        max_output_tokens=settings.max_output_tokens,
        timeout_s=settings.request_timeout_s,
    )


def get_ai_platform() -> AIPlatform:
    platform = _platform()
    if platform is None:
        raise HTTPException(503, "The assistant is not set up yet. Please try again later.")
    return platform
