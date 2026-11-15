"""Provider-agnostic chat interface.

Swap providers by implementing `AIPlatform` and wiring it in `api/deps.py`.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
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
