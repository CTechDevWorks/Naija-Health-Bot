"""Provider-agnostic chat interface.

Swap providers by implementing `AIPlatform` and wiring it in `main.py`.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from collections.abc import Iterator
from typing import TypedDict


class Message(TypedDict):
    role: str  # "system" | "user" | "assistant"
    content: str


class AIPlatformError(RuntimeError):
    """Raised when every configured model failed to answer."""


class AIPlatform(ABC):
    name: str = "unknown"
    model: str = "unknown"

    @abstractmethod
    def chat(self, messages: list[Message]) -> tuple[str, str]:
        """Return (full_text, model_used)."""

    @abstractmethod
    def stream(self, messages: list[Message]) -> Iterator[tuple[str, str]]:
        """Yield (text_delta, model_used) pairs as tokens arrive."""
