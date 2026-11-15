"""
Request / response models for POST /flashcards/generate, plus the strict
validation applied to whatever the model hands back through the tool call.

Nothing the model produces is trusted: stringified JSON is unwrapped, fields are
trimmed and length-capped, duplicates and obviously broken cards are dropped,
and the 50-card ceiling is enforced here regardless of what the prompt said.
"""

from __future__ import annotations

import json
import logging
import re
from typing import Any, Literal

from pydantic import BaseModel, Field, ValidationError, field_validator, model_validator

from config import settings

log = logging.getLogger("kadet.flashcards.schemas")

MAX_CARDS = settings.flashcard_max_cards

LIMITS = {
    "title": 120,
    "subject": 60,
    "topic": 120,
    "description": 600,
    "front": 1000,
    "back": 1500,
    "hint": 300,
    "explanation": 1200,
    "tag": 30,
    "tags": 8,
}

Difficulty = Literal["easy", "medium", "hard"]
DeckDifficulty = Literal["easy", "medium", "hard", "mixed"]
SourceKind = Literal["prompt", "notes", "canvas", "research"]


# ── Request ─────────────────────────────────────────────────────────────


class GenTurn(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=4000)


class GenerateOptions(BaseModel):
    card_count: int | None = Field(default=None, ge=1, le=MAX_CARDS)
    difficulty: DeckDifficulty | None = None
    exam: Literal["WASSCE", "NECO", "JAMB", "BECE", "other"] | None = None
    level: str | None = Field(default=None, max_length=40)


class GenerateSource(BaseModel):
    kind: SourceKind = "prompt"
    content: str | None = Field(default=None, max_length=settings.flashcard_max_source_chars)
    label: str | None = Field(default=None, max_length=120)


class GenerateRequest(BaseModel):
    messages: list[GenTurn] = Field(min_length=1, max_length=20)
    options: GenerateOptions = Field(default_factory=GenerateOptions)
    source: GenerateSource = Field(default_factory=GenerateSource)


# ── Validated deck (what the model must produce) ────────────────────────


def _clean(value: Any, limit: int) -> str:
    text = str(value or "").strip()
    text = re.sub(r"[ \t]+", " ", text)
    return text[:limit]


class GeneratedCard(BaseModel):
    front: str
    back: str
    hint: str | None = None
    explanation: str | None = None
    difficulty: Difficulty = "medium"
    tags: list[str] = Field(default_factory=list)

    @model_validator(mode="before")
    @classmethod
    def _coerce(cls, data: Any) -> Any:
        if not isinstance(data, dict):
            raise ValueError("card must be an object")
        out: dict[str, Any] = {}
        # Accept common aliases small models drift towards.
        out["front"] = _clean(data.get("front") or data.get("question") or data.get("q"), LIMITS["front"])
        out["back"] = _clean(data.get("back") or data.get("answer") or data.get("a"), LIMITS["back"])
        hint = _clean(data.get("hint"), LIMITS["hint"])
        expl = _clean(data.get("explanation") or data.get("extra"), LIMITS["explanation"])
        out["hint"] = hint or None
        out["explanation"] = expl or None
        diff = str(data.get("difficulty") or "medium").strip().lower()
        out["difficulty"] = diff if diff in ("easy", "medium", "hard") else "medium"
        tags = data.get("tags") or []
        if isinstance(tags, str):
            tags = [t for t in re.split(r"[,;]", tags)]
        cleaned: list[str] = []
        for t in tags if isinstance(tags, list) else []:
            tag = _clean(t, LIMITS["tag"]).lower()
            if tag and tag not in cleaned:
                cleaned.append(tag)
        out["tags"] = cleaned[: LIMITS["tags"]]
        return out

    @field_validator("front", "back")
    @classmethod
    def _non_empty(cls, v: str) -> str:
        if not v:
            raise ValueError("front and back are required")
        return v


class GeneratedDeck(BaseModel):
    title: str
    subject: str
    topic: str = ""
    description: str = ""
    difficulty: DeckDifficulty = "mixed"
    cards: list[GeneratedCard]

    @model_validator(mode="before")
    @classmethod
    def _coerce(cls, data: Any) -> Any:
        if isinstance(data, str):
            data = json.loads(data)
        if not isinstance(data, dict):
            raise ValueError("deck must be an object")
        out = dict(data)
        # Small models sometimes double-encode the array as a JSON string.
        cards = out.get("cards")
        if isinstance(cards, str):
            try:
                cards = json.loads(cards)
            except json.JSONDecodeError as err:
                raise ValueError("cards is not valid JSON") from err
        if not isinstance(cards, list):
            raise ValueError("cards must be a list")
        out["cards"] = cards
        out["title"] = _clean(out.get("title"), LIMITS["title"])
        out["subject"] = _clean(out.get("subject"), LIMITS["subject"])
        out["topic"] = _clean(out.get("topic"), LIMITS["topic"])
        out["description"] = _clean(out.get("description"), LIMITS["description"])
        diff = str(out.get("difficulty") or "mixed").strip().lower()
        out["difficulty"] = diff if diff in ("easy", "medium", "hard", "mixed") else "mixed"
        return out

    @field_validator("title", "subject")
    @classmethod
    def _required(cls, v: str) -> str:
        if not v:
            raise ValueError("title and subject are required")
        return v

    @field_validator("cards", mode="before")
    @classmethod
    def _lint_cards(cls, raw: list[Any]) -> list[Any]:
        """Drop broken / duplicate cards individually instead of failing the whole deck."""
        kept: list[GeneratedCard] = []
        seen: set[str] = set()
        dropped = 0
        for item in raw:
            try:
                card = GeneratedCard.model_validate(item)
            except (ValidationError, ValueError):
                dropped += 1
                continue
            key = re.sub(r"[^a-z0-9]+", " ", card.front.lower()).strip()
            if not key or key in seen or card.front.lower() == card.back.lower():
                dropped += 1
                continue
            seen.add(key)
            kept.append(card)
        if dropped:
            log.info("dropped %d malformed/duplicate cards", dropped)
        if len(kept) > MAX_CARDS:
            log.info("model returned %d cards — truncating to %d", len(kept), MAX_CARDS)
            kept = kept[:MAX_CARDS]
        if not kept:
            raise ValueError("no usable cards")
        return kept


# ── Response envelope ───────────────────────────────────────────────────


class DeckResponse(BaseModel):
    kind: Literal["deck"] = "deck"
    deck: GeneratedDeck
    model: str


class ClarifyResponse(BaseModel):
    kind: Literal["clarify"] = "clarify"
    message: str
    model: str | None = None


class RefusedResponse(BaseModel):
    kind: Literal["refused"] = "refused"
    message: str


GenerateResponse = DeckResponse | ClarifyResponse | RefusedResponse
