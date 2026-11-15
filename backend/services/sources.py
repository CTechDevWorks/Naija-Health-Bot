"""
Approved references for the assistant.

`knowledge_base/sources.json` is the explicitly maintained list of sources the
assistant may point to. The model is told to finish each answer with a line such
as `Sources: who-malaria, ncdc`. This module reads that line, keeps only ids
that are on the list, and removes any link in the answer that is not on it — so
an invented source can never reach the user.

When RAG is on, returned sources come from the passages that were retrieved for
the question. When RAG is off, a returned source only means the model pointed at
an approved page — not that the answer was checked against that page.
"""

from __future__ import annotations

import json
import logging
import re
from functools import lru_cache

from config import settings
from schemas import Source

log = logging.getLogger("naija_health.sources")


class KnowledgeSource(Source):
    # What the page is good for; shown to the model, not to the user.
    covers: str


@lru_cache(maxsize=1)
def load_sources() -> dict[str, KnowledgeSource]:
    raw = json.loads(settings.sources_path.read_text(encoding="utf-8"))
    sources = [KnowledgeSource(**item) for item in raw]
    return {source.id: source for source in sources}


def sources_for_prompt() -> str:
    """The approved list, formatted for the system prompt."""
    return "\n".join(
        f"- {source.id}: {source.organisation}, {source.title} ({source.covers})"
        for source in load_sources().values()
    )


# A whole line such as "Sources: who-malaria, ncdc" or "**Sources:** none".
_SOURCES_LINE = re.compile(r"^\W*sources?\W*:(?P<ids>.*)$", re.IGNORECASE)
_SOURCE_ID = re.compile(r"[a-z0-9]+(?:-[a-z0-9]+)*")


def extract_sources(text: str) -> tuple[str, list[Source]]:
    """Split the model's answer into (answer without its Sources line, approved sources)."""
    approved = load_sources()
    kept_lines: list[str] = []
    found: list[Source] = []

    for line in text.split("\n"):
        match = _SOURCES_LINE.match(line.strip())
        if not match:
            kept_lines.append(line)
            continue
        for source_id in _SOURCE_ID.findall(match.group("ids").lower()):
            source = approved.get(source_id)
            if source is None:
                if source_id != "none":
                    log.warning("model cited a source that is not on the approved list")
                continue
            if all(source.id != existing.id for existing in found):
                found.append(Source(**source.model_dump(exclude={"covers"})))

    return "\n".join(kept_lines).strip(), found


_MARKDOWN_LINK = re.compile(r"\[([^\]]+)\]\((https?://[^)\s]+)\)")
_BARE_URL = re.compile(r"https?://[^\s)\]>]+")


def remove_unapproved_links(text: str) -> str:
    """Drop any web address that is not one of the approved source URLs."""
    approved = {source.url.rstrip("/") for source in load_sources().values()}

    def keep_or_drop(match: re.Match[str]) -> str:
        url = match.group(0).rstrip(".,;:!?")
        trailing = match.group(0)[len(url) :]
        return match.group(0) if url.rstrip("/") in approved else trailing

    # The app shows plain text, so a Markdown link is reduced to its label first.
    text = _MARKDOWN_LINK.sub(lambda m: f"{m.group(1)} {m.group(2)}", text)
    text = _BARE_URL.sub(keep_or_drop, text)
    # Tidy the gap a removed address leaves behind ("see  ." → "see.").
    text = re.sub(r"[ \t]{2,}", " ", text)
    return re.sub(r"[ \t]+([.,;:!?])", r"\1", text).strip()
