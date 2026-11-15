"""AI flashcard generation — tool schema, validation and orchestration."""

from .schemas import GenerateRequest, GenerateResponse
from .service import generate_deck

__all__ = ["GenerateRequest", "GenerateResponse", "generate_deck"]
