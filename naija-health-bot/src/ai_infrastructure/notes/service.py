"""
Orchestrates one note generation turn:

    request → guardrail screen → system prompt + options + source + messages
            → model with `generate_notes` tool
            → normalized BlockNote document | clarify | refusal
"""

from __future__ import annotations

import json
import logging
import re
from functools import lru_cache
from typing import Any

from ai.base import AIPlatformError, Message
from ai.bluesminds import BluesMinds, ToolResult
from config import settings
from guardrails import screen_input

from .schemas import (
    ClarifyResponse,
    GeneratedNote,
    GenerateNotesRequest,
    GenerateNotesResponse,
    NoteResponse,
    RefusedResponse,
    normalize_block,
)
from .tool import GENERATE_NOTES_TOOL, TOOL_NAME

log = logging.getLogger("kadet.notes")

MODEL_EXTRAS: dict[str, dict] = {
    "openai/gpt-oss-20b": {"reasoning_effort": "low"},
    "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning": {"chat_template_kwargs": {"enable_thinking": False}},
}


class GenerationFailed(RuntimeError):
    """The model could not produce usable notes."""


@lru_cache(maxsize=1)
def load_prompt() -> str:
    return (settings.prompts_dir / "notes_prompt.md").read_text(encoding="utf-8").strip()


def _options_note(request: GenerateNotesRequest) -> str | None:
    parts: list[str] = []
    if request.options.exam:
        parts.append(f"Target exam board: {request.options.exam}")
    if request.options.level:
        parts.append(f"Student academic level: {request.options.level}")
    if request.options.depth:
        parts.append(f"Requested depth: {request.options.depth}")
    if not parts:
        return None
    return "Generation instructions:\n" + "\n".join(f"- {p}" for p in parts)


def _source_note(request: GenerateNotesRequest) -> str | None:
    content = (request.source.content or "").strip()
    if not content:
        return None
    label = request.source.label or request.source.kind
    return (
        f"Source material supplied by student ({label}):\n"
        "---\n"
        f"{content}\n"
        "---\n"
        "Base your notes primarily on the facts, terms, and context in this source material."
    )


def build_messages(request: GenerateNotesRequest) -> list[Message]:
    messages: list[Message] = [{"role": "system", "content": load_prompt()}]
    if opt := _options_note(request):
        messages.append({"role": "system", "content": opt})
    if src := _source_note(request):
        messages.append({"role": "system", "content": src})
    for turn in request.messages[-10:]:
        messages.append({"role": turn.role, "content": turn.content.strip()})
    return messages


_BAD_ESCAPE = re.compile(r'\\(?!["\\/bfnrtu])')


def _repair_json(raw: str) -> str:
    return _BAD_ESCAPE.sub("", raw)


def _parse_tool_args(raw: str) -> dict[str, Any]:
    raw = raw.strip()
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        repaired = _repair_json(raw)
        try:
            data = json.loads(repaired)
        except json.JSONDecodeError:
            start, end = repaired.find("{"), repaired.rfind("}")
            if start == -1 or end <= start:
                raise
            data = json.loads(repaired[start : end + 1])
    if isinstance(data, str):
        data = json.loads(data)
    if not isinstance(data, dict):
        raise ValueError("Tool arguments must be a JSON object")
    return data


def _call(platform: BluesMinds, messages: list[Message]) -> ToolResult:
    return platform.call_with_tools(
        messages,
        [GENERATE_NOTES_TOOL],
        models=settings.notes_models,
        tool_choice="auto",
        temperature=0.35,
        max_tokens=settings.notes_max_output_tokens,
        model_extras=MODEL_EXTRAS,
        timeout_s=settings.notes_timeout_s,
    )


def generate_notes(
    platform: BluesMinds,
    request: GenerateNotesRequest,
    user_id: str,
) -> GenerateNotesResponse:
    last_user = next((t.content for t in reversed(request.messages) if t.role == "user"), "")

    # Safety screen
    verdict = screen_input(last_user)
    if verdict.blocked:
        log.info("notes guardrail %s for %s", verdict.label, user_id)
        return RefusedResponse(message=verdict.reply or "Kadet only builds educational study notes.")
    if request.source.content:
        src_verdict = screen_input(request.source.content[:4000])
        if src_verdict.blocked:
            return RefusedResponse(message=src_verdict.reply or "Kadet only builds educational study notes.")

    messages = build_messages(request)

    attempts = 0
    nudge: str | None = None
    while attempts < 2:
        attempts += 1
        call_messages = list(messages)
        if nudge:
            call_messages.append({"role": "user", "content": nudge})

        try:
            result = _call(platform, call_messages)
        except AIPlatformError as err:
            log.warning("notes model call attempt %d failed: %s", attempts, err)
            if attempts >= 2:
                raise GenerationFailed(str(err)) from err
            continue

        target_call = next((c for c in result.tool_calls if c.name == TOOL_NAME), None)

        if not target_call:
            # Model replied in natural text (e.g. asking to clarify topic)
            text = (result.text or "").strip()
            if text:
                return ClarifyResponse(message=text)
            log.warning("model %s produced neither tool call nor text", result.model)
            if attempts >= 2:
                raise GenerationFailed("Model gave no reply.")
            nudge = "Please call the generate_notes tool to write the study notes."
            continue

        try:
            args = _parse_tool_args(target_call.arguments)
        except Exception as err:
            log.warning("failed to parse generate_notes arguments: %s", err)
            if attempts >= 2:
                raise GenerationFailed("Failed to parse tool arguments") from err
            nudge = "Your generate_notes JSON was slightly malformed. Please output valid JSON arguments."
            continue

        title = str(args.get("title") or "Study Notes").strip()[:120]
        subject = str(args.get("subject") or "General").strip()[:60]
        topic = str(args.get("topic") or title).strip()[:120]
        summary = str(args.get("summary") or "").strip()[:400]

        raw_blocks = args.get("blocks", [])
        if not isinstance(raw_blocks, list):
            raw_blocks = []

        clean_blocks: list[dict[str, Any]] = []
        for rb in raw_blocks:
            nb = normalize_block(rb)
            if nb:
                clean_blocks.append(nb)

        # Ensure document is not empty
        if not clean_blocks:
            clean_blocks = [
                {
                    "id": "b_init",
                    "type": "heading",
                    "props": {"level": 1},
                    "content": [{"type": "text", "text": title, "styles": {}}],
                },
                {
                    "id": "b_p1",
                    "type": "paragraph",
                    "content": [{"type": "text", "text": summary or f"Notes for {topic}", "styles": {}}],
                },
            ]

        generated = GeneratedNote(
            title=title,
            subject=subject,
            topic=topic,
            summary=summary,
            blocks=clean_blocks,
        )
        return NoteResponse(note=generated, model=result.model)

    raise GenerationFailed("Exhausted retries without valid note generation")
