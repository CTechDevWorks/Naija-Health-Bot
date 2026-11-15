"""
Request / response models for POST /notes/generate and normalization
to native BlockNote document block structures.
"""

from __future__ import annotations

import json
import logging
import re
import uuid
from typing import Annotated, Any, Literal, Union

from pydantic import BaseModel, Field

from config import settings

log = logging.getLogger("kadet.notes.schemas")

LIMITS = {
    "title": 120,
    "subject": 60,
    "topic": 120,
    "summary": 600,
    "source": settings.notes_max_source_chars,
}

SourceKind = Literal["prompt", "notes", "canvas", "research"]


# ── Request Models ────────────────────────────────────────────────────────


class GenTurn(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=settings.max_message_chars)


class GenerateNotesOptions(BaseModel):
    exam: Literal["WASSCE", "NECO", "JAMB", "BECE", "other"] | None = None
    level: str | None = Field(default=None, max_length=40)
    depth: Literal["concise", "standard", "comprehensive"] | None = None


class GenerateNotesSource(BaseModel):
    kind: SourceKind = "prompt"
    content: str | None = Field(default=None, max_length=LIMITS["source"])
    label: str | None = Field(default=None, max_length=120)


class GenerateNotesRequest(BaseModel):
    messages: list[GenTurn] = Field(min_length=1, max_length=settings.max_history_messages)
    options: GenerateNotesOptions = Field(default_factory=GenerateNotesOptions)
    source: GenerateNotesSource = Field(default_factory=GenerateNotesSource)


# ── BlockNote Inline & Block Parsing ──────────────────────────────────────


_INLINE_RE = re.compile(
    r"(?P<bold>\*\*(?P<bold_text>[^*]+)\*\*)|"
    r"(?P<italic>\*(?P<italic_text>[^*]+)\*)|"
    r"(?P<code>`(?P<code_text>[^`]+)`)|"
    r"(?P<plain>[^*`]+)"
)


def parse_inline_markdown(text: str, default_styles: dict[str, Any] | None = None) -> list[dict[str, Any]]:
    """Convert a text string with markdown marks (**bold**, *italic*, `code`) into BlockNote inline text nodes."""
    raw = str(text or "").strip()
    if not raw:
        return []

    spans: list[dict[str, Any]] = []
    base_styles = dict(default_styles or {})

    for match in _INLINE_RE.finditer(raw):
        if match.group("bold"):
            val = match.group("bold_text")
            styles = {**base_styles, "bold": True}
        elif match.group("italic"):
            val = match.group("italic_text")
            styles = {**base_styles, "italic": True}
        elif match.group("code"):
            val = match.group("code_text")
            styles = {**base_styles, "code": True}
        else:
            val = match.group("plain") or ""
            styles = dict(base_styles)

        if val:
            spans.append({"type": "text", "text": val, "styles": styles})

    if not spans:
        spans.append({"type": "text", "text": raw, "styles": base_styles})

    return spans


def normalize_child(raw: Any) -> dict[str, Any] | None:
    if not isinstance(raw, dict):
        return None
    btype = str(raw.get("type") or "paragraph")
    text = str(raw.get("text") or raw.get("content") or "").strip()

    if btype == "codeBlock":
        code = str(raw.get("code") or text or "")
        return {
            "id": f"c_{uuid.uuid4().hex[:8]}",
            "type": "codeBlock",
            "props": {"language": str(raw.get("language") or "text")},
            "content": code,
        }
    if btype == "quote":
        return {
            "id": f"c_{uuid.uuid4().hex[:8]}",
            "type": "quote",
            "content": parse_inline_markdown(text),
        }
    if btype == "bulletListItem":
        return {
            "id": f"c_{uuid.uuid4().hex[:8]}",
            "type": "bulletListItem",
            "content": parse_inline_markdown(text),
        }
    if btype == "numberedListItem":
        return {
            "id": f"c_{uuid.uuid4().hex[:8]}",
            "type": "numberedListItem",
            "content": parse_inline_markdown(text),
        }

    return {
        "id": f"c_{uuid.uuid4().hex[:8]}",
        "type": "paragraph",
        "content": parse_inline_markdown(text),
    }


def normalize_block(raw: Any) -> dict[str, Any] | None:
    """Safely convert any block dictionary into a 100% compliant BlockNote block."""
    if not isinstance(raw, dict):
        return None

    btype = str(raw.get("type") or "paragraph").strip()
    block_id = str(raw.get("id") or f"b_{uuid.uuid4().hex[:8]}")

    # Divider
    if btype == "divider":
        return {"id": block_id, "type": "divider"}

    # Table
    if btype == "table":
        table_data = raw.get("table")
        rows_data: list[dict[str, Any]] = []

        if isinstance(table_data, dict):
            headers = [str(h).strip() for h in table_data.get("headers", []) if str(h).strip()]
            raw_rows = table_data.get("rows", [])
            if headers:
                rows_data.append({
                    "cells": [parse_inline_markdown(h, {"bold": True}) for h in headers]
                })
            for r in raw_rows:
                if isinstance(r, list):
                    cells = [parse_inline_markdown(str(c)) for c in r]
                    if cells:
                        rows_data.append({"cells": cells})
        elif isinstance(raw.get("content"), dict) and "rows" in raw["content"]:
            # Direct BlockNote tableContent passed through
            return {"id": block_id, "type": "table", "content": raw["content"]}

        if not rows_data:
            return None

        return {
            "id": block_id,
            "type": "table",
            "content": {
                "type": "tableContent",
                "rows": rows_data,
            },
        }

    # Code block
    if btype == "codeBlock":
        code_str = str(raw.get("code") or raw.get("text") or raw.get("content") or "").strip()
        lang = str(raw.get("language") or "text").strip()
        return {
            "id": block_id,
            "type": "codeBlock",
            "props": {"language": lang},
            "content": code_str,
        }

    # Extract text content
    text_content = raw.get("text") or raw.get("content") or ""
    color = raw.get("textColor")
    styles = {"textColor": color} if color and color != "default" else None

    # Handle native BlockNote inline array if provided
    if isinstance(text_content, list):
        inline_spans = text_content
    else:
        inline_spans = parse_inline_markdown(str(text_content), styles)

    # Heading
    if btype == "heading":
        lvl = raw.get("level")
        try:
            level = max(1, min(3, int(lvl if lvl is not None else 2)))
        except (ValueError, TypeError):
            level = 2
        return {
            "id": block_id,
            "type": "heading",
            "props": {"level": level},
            "content": inline_spans,
        }

    # Check list item
    if btype == "checkListItem":
        checked = bool(raw.get("checked", False))
        return {
            "id": block_id,
            "type": "checkListItem",
            "props": {"checked": checked},
            "content": inline_spans,
        }

    # Toggle list item (collapsible accordion with nested children)
    if btype == "toggleListItem":
        raw_kids = raw.get("children", [])
        norm_kids: list[dict[str, Any]] = []
        if isinstance(raw_kids, list):
            for k in raw_kids:
                nk = normalize_child(k)
                if nk:
                    norm_kids.append(nk)

        return {
            "id": block_id,
            "type": "toggleListItem",
            "content": inline_spans or [{"type": "text", "text": "Details (click to expand)", "styles": {"bold": True}}],
            "children": norm_kids,
        }

    # Bullet list item
    if btype == "bulletListItem":
        raw_kids = raw.get("children", [])
        norm_kids = []
        if isinstance(raw_kids, list):
            for k in raw_kids:
                nk = normalize_child(k)
                if nk:
                    norm_kids.append(nk)
        res: dict[str, Any] = {
            "id": block_id,
            "type": "bulletListItem",
            "content": inline_spans,
        }
        if norm_kids:
            res["children"] = norm_kids
        return res

    # Numbered list item
    if btype == "numberedListItem":
        raw_kids = raw.get("children", [])
        norm_kids = []
        if isinstance(raw_kids, list):
            for k in raw_kids:
                nk = normalize_child(k)
                if nk:
                    norm_kids.append(nk)
        res = {
            "id": block_id,
            "type": "numberedListItem",
            "content": inline_spans,
        }
        if norm_kids:
            res["children"] = norm_kids
        return res

    # Quote
    if btype == "quote":
        return {
            "id": block_id,
            "type": "quote",
            "content": inline_spans,
        }

    # Default: paragraph
    return {
        "id": block_id,
        "type": "paragraph",
        "content": inline_spans,
    }


# ── Response Models ───────────────────────────────────────────────────────


class GeneratedNote(BaseModel):
    title: str = Field(min_length=1, max_length=LIMITS["title"])
    subject: str = Field(min_length=1, max_length=LIMITS["subject"])
    topic: str = Field(min_length=1, max_length=LIMITS["topic"])
    summary: str = Field(default="", max_length=LIMITS["summary"])
    blocks: list[dict[str, Any]] = Field(min_length=1)


class NoteResponse(BaseModel):
    kind: Literal["note"] = "note"
    note: GeneratedNote
    model: str


class ClarifyResponse(BaseModel):
    kind: Literal["clarify"] = "clarify"
    message: str


class RefusedResponse(BaseModel):
    kind: Literal["refused"] = "refused"
    message: str


GenerateNotesResponse = Annotated[
    Union[NoteResponse, ClarifyResponse, RefusedResponse],
    Field(discriminator="kind"),
]
