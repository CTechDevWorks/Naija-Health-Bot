"""
The assistant's request pipeline:

    transcript → sanitise → input guardrails → model → output checks → sources

Routes stay thin and call `answer`; everything that decides what the user sees
lives here.
"""

from __future__ import annotations

import logging
from functools import lru_cache

from ai.base import AIPlatform
from config import settings
from guardrails import REPLY_NO_DOSING, build_conversation, contains_dosage, screen_input
from schemas import ChatResponse

from .sources import extract_sources, remove_unapproved_links, sources_for_prompt

log = logging.getLogger("naija_health.chat")

GUARDRAIL_MODEL = "guardrail"


@lru_cache(maxsize=1)
def load_system_prompt() -> str:
    template = (settings.prompts_dir / "system_prompt.md").read_text(encoding="utf-8")
    return template.replace("{{SOURCES}}", sources_for_prompt()).strip()


def answer(platform: AIPlatform, history: list[dict]) -> ChatResponse:
    """
    Produce the assistant's reply to the last user message in `history`.

    Raises InvalidTranscript for an unusable transcript and AIPlatformError when
    every model failed; the route turns those into HTTP errors.
    """
    messages = build_conversation(history, load_system_prompt())

    verdict = screen_input(messages[-1]["content"])
    if verdict.blocked:
        # The label only — never who asked or what they wrote.
        log.info("input guardrail triggered: %s", verdict.label)
        return ChatResponse(
            response=verdict.reply or "",
            model=GUARDRAIL_MODEL,
            guardrail=verdict.label,
            urgent=verdict.urgent,
        )

    text, model = platform.chat(messages)

    if contains_dosage(text):
        log.warning("output guardrail triggered: dosage (model %s)", model)
        return ChatResponse(response=REPLY_NO_DOSING, model=model, guardrail="dosage")

    body, sources = extract_sources(text)
    return ChatResponse(response=remove_unapproved_links(body), model=model, sources=sources)
