"""Summarise scraped health articles with BluesMinds (no web browsing)."""

from __future__ import annotations

import json
import logging
import re
from dataclasses import dataclass
from typing import Any, Literal

from ai.base import AIPlatform, AIPlatformError
from services.reports_scraper import ScrapedArticle

log = logging.getLogger("naija_health.reports.summarizer")

Topic = Literal[
    "disease",
    "policy",
    "vaccine",
    "outbreak",
    "medical_tech",
    "guidance",
    "other",
]
Scope = Literal["nigeria", "west_africa", "global"]
Urgency = Literal["low", "medium", "high"]

SYSTEM_PROMPT = """You are a health-information editor for 9ja Health, a Nigerian public-health app.

You receive ONE real article that was already fetched from an official or trusted source. You do NOT have internet access. Use ONLY the provided text.

Your job:
1. Write a clear public briefing of exactly TWO short paragraphs.
2. Classify topic, location scope, and urgency.
3. Return valid JSON only. No markdown. No extra keys.

Rules:
- Never invent facts, numbers, dates, places, or claims not present in the source text.
- Never give medical advice, diagnoses, or medicine doses.
- If the text is not health-related or is too thin to summarise, set "skip" to true and explain why in "skip_reason".
- Prefer Nigeria-relevant framing when the article is about Nigeria or West Africa.
- Put the write-up in "summary_paragraphs" as an array of exactly two strings.
- Each paragraph should be 2–4 sentences in plain English (no newline characters inside a paragraph).
- Paragraph 1: what happened / what the authority said.
- Paragraph 2: why it matters for people in Nigeria (or globally if it is a world update), without inventing advice.
- Do not put the source URL inside the write-up; the app shows the link separately.
- Set is_ai_summary to true always.
"""


@dataclass(frozen=True)
class SummaryResult:
    skip: bool
    skip_reason: str | None
    title: str
    summary: str
    topic: Topic
    location_scope: Scope
    urgency: Urgency
    is_ai_summary: bool
    raw_excerpt: str
    model_used: str


def _user_prompt(article: ScrapedArticle) -> str:
    return f"""Summarise and classify this health update.

SOURCE_NAME: {article.source_name}
SOURCE_SLUG: {article.source_slug}
ORIGINAL_URL: {article.original_url}
PUBLISHED_AT: {article.published_at.isoformat()}
TITLE: {article.title}

ARTICLE_TEXT:
{article.article_text[:9000]}

Return exactly this JSON shape:
{{
  "skip": false,
  "skip_reason": null,
  "title": "cleaned title from the source",
  "summary_paragraphs": [
    "First paragraph about what the source reported.",
    "Second paragraph about why it matters for the public."
  ],
  "topic": "disease|policy|vaccine|outbreak|medical_tech|guidance|other",
  "location_scope": "nigeria|west_africa|global",
  "urgency": "low|medium|high",
  "is_ai_summary": true,
  "raw_excerpt": "1-3 short sentences copied or lightly trimmed from the source"
}}
"""


def _extract_json(text: str) -> dict[str, Any]:
    raw = text.strip()
    if raw.startswith("```"):
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", raw, re.S)
        if not match:
            raise
        return json.loads(match.group(0))


def _as_topic(value: Any) -> Topic:
    allowed: set[str] = {
        "disease",
        "policy",
        "vaccine",
        "outbreak",
        "medical_tech",
        "guidance",
        "other",
    }
    text = str(value or "other").strip().lower()
    return text if text in allowed else "other"  # type: ignore[return-value]


def _as_scope(value: Any, source_slug: str) -> Scope:
    text = str(value or "").strip().lower()
    if text in {"nigeria", "west_africa", "global"}:
        return text  # type: ignore[return-value]
    if source_slug == "ncdc":
        return "nigeria"
    if source_slug == "who-afro":
        return "west_africa"
    return "global"


def _as_urgency(value: Any) -> Urgency:
    text = str(value or "low").strip().lower()
    if text in {"low", "medium", "high"}:
        return text  # type: ignore[return-value]
    return "low"


def _fallback_writeup(article: ScrapedArticle) -> str:
    first = (
        f"{article.source_name} has issued an official update titled "
        f"“{article.title}”."
    )
    second = (
        "This notice comes from a trusted public-health source. "
        "Open the original link below to read the full details in the authority’s own words."
    )
    return f"{first}\n\n{second}"


def summarise_article(platform: AIPlatform, article: ScrapedArticle) -> SummaryResult:
    model = "fallback"
    data: dict[str, Any] = {}
    try:
        text, model = platform.chat(
            [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": _user_prompt(article)},
            ]
        )
        data = _extract_json(text)
    except (AIPlatformError, json.JSONDecodeError, ValueError) as err:
        log.warning(
            "AI write-up unavailable for %s (%s) — using safe fallback",
            article.original_url,
            type(err).__name__,
        )
        return SummaryResult(
            skip=False,
            skip_reason=None,
            title=article.title,
            summary=_fallback_writeup(article),
            topic="outbreak" if "outbreak" in article.title.lower() else "guidance",
            location_scope=_as_scope(None, article.source_slug),
            urgency="medium" if article.source_slug == "ncdc" else "low",
            is_ai_summary=False,
            raw_excerpt=article.article_text[:500],
            model_used=model,
        )

    skip = bool(data.get("skip"))
    title = str(data.get("title") or article.title).strip()[:300] or article.title
    paragraphs = data.get("summary_paragraphs")
    if isinstance(paragraphs, list):
        cleaned = [str(part).strip() for part in paragraphs if str(part).strip()]
        summary = "\n\n".join(cleaned[:2])
    else:
        summary = str(data.get("summary") or "").strip()
    excerpt = str(data.get("raw_excerpt") or "").strip()[:4000]
    if not skip and len(summary) < 80:
        summary = _fallback_writeup(article)

    return SummaryResult(
        skip=skip,
        skip_reason=(str(data.get("skip_reason")) if data.get("skip_reason") else None),
        title=title,
        summary=summary[:4000] if summary else _fallback_writeup(article),
        topic=_as_topic(data.get("topic")),
        location_scope=_as_scope(data.get("location_scope"), article.source_slug),
        urgency=_as_urgency(data.get("urgency")),
        is_ai_summary=True,
        raw_excerpt=excerpt or article.article_text[:500],
        model_used=model,
    )
