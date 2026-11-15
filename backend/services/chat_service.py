"""
The assistant's request pipeline:

    transcript → sanitise → input guardrails → retrieve → model
        → scope → medicine checks → sources

Routes stay thin and call `answer`; everything that decides what the user sees
lives here.

Every check after the model replaces the whole answer with a fixed reply when it
fires. Nothing the model wrote is kept in that case, sources included.
"""

from __future__ import annotations

import logging
from functools import lru_cache

from ai.base import AIPlatform
from config import settings
from guardrails import (
    REPLY_APP_REFERRAL,
    REPLY_NO_DOSING,
    REPLY_NO_MEDICINE,
    REPLY_OFF_TOPIC,
    SCOPE_APP,
    SCOPE_OTHER,
    build_conversation,
    contains_dosage,
    find_unapproved_medicines,
    is_on_topic,
    is_pleasantry,
    screen_input,
    split_scope,
)
from schemas import ChatResponse, Source
from services.retrieval import (
    Passage,
    RetrievalError,
    allowed_medicine_context,
    get_retriever,
    passages_for_prompt,
    source_ids_from,
)
from services.sources import extract_sources, load_sources, remove_unapproved_links, sources_for_prompt

log = logging.getLogger("naija_health.chat")

GUARDRAIL_MODEL = "guardrail"

# How many earlier turns a labelled follow-up may lean on to count as on topic.
CONTEXT_TURNS = 2

REPLY_NO_ANSWER = (
    "Sorry, I couldn't put an answer together for that. Please try asking your "
    "malaria question again in a different way."
)

REPLY_NO_KNOWLEDGE = (
    "I don't have trusted information on that in my malaria knowledge base. "
    "Please ask about how malaria spreads, prevention, symptoms, testing or "
    "treatment in general terms, or speak with a qualified health worker."
)

_PASSAGES_BLOCK = """
## Retrieved knowledge

The passages below are the only malaria facts you may use for this answer. Treat
them as the whole of what you know for this turn.

- Base every malaria claim on these passages. If they do not cover the question,
  say plainly that you do not have that information and suggest a health worker.
- Do not add facts, numbers, medicine names or advice that are not in them.
- When you finish with `Sources:`, list only ids that appear in the passages
  (the "sources:" line on each passage). Use `Sources: none` if none apply.
""".strip()


@lru_cache(maxsize=1)
def load_system_prompt() -> str:
    template = (settings.prompts_dir / "system_prompt.md").read_text(encoding="utf-8")
    return template.replace("{{SOURCES}}", sources_for_prompt()).strip()


def _with_passages(system_prompt: str, passages: list[Passage]) -> str:
    block = passages_for_prompt(passages)
    if not block:
        return system_prompt
    return f"{system_prompt}\n\n{_PASSAGES_BLOCK}\n\n{block}"


def _sources_for(passages: list[Passage], cited: list[Source]) -> list[Source]:
    """Prefer sources from the passages actually retrieved; keep model order."""
    approved = load_sources()
    allowed = set(source_ids_from(passages))
    if not allowed:
        return cited
    ordered: list[Source] = []
    for source in cited:
        if source.id in allowed and all(source.id != s.id for s in ordered):
            ordered.append(source)
    if ordered:
        return ordered
    # Model forgot the Sources line; still show the passages' sources.
    return [
        Source(**approved[sid].model_dump(exclude={"covers"}))
        for sid in source_ids_from(passages)
        if sid in approved
    ]


def answer(platform: AIPlatform, history: list[dict]) -> ChatResponse:
    """
    Produce the assistant's reply to the last user message in `history`.

    Raises InvalidTranscript for an unusable transcript and AIPlatformError when
    every model failed; the route turns those into HTTP errors.
    """
    base_prompt = load_system_prompt()
    draft = build_conversation(history, base_prompt)
    question = draft[-1]["content"]

    verdict = screen_input(question)
    if verdict.blocked:
        log.info("input guardrail triggered: %s", verdict.label)
        return ChatResponse(
            response=verdict.reply or "",
            model=GUARDRAIL_MODEL,
            guardrail=verdict.label,
            urgent=verdict.urgent,
        )

    passages: list[Passage] = []
    rag_on = settings.rag_configured
    if rag_on and not is_pleasantry(question):
        try:
            passages = get_retriever().search(question)
        except RetrievalError as err:
            log.error("retrieval failed: %s", err)
            return ChatResponse(
                response=REPLY_NO_ANSWER,
                model=GUARDRAIL_MODEL,
                guardrail="retrieval_failed",
            )
        if not passages:
            log.info("retrieval returned no passages")
            return ChatResponse(
                response=REPLY_NO_KNOWLEDGE,
                model=GUARDRAIL_MODEL,
                guardrail="no_knowledge",
            )

    messages = build_conversation(history, _with_passages(base_prompt, passages))
    text, model = platform.chat(messages)
    medicine_context = allowed_medicine_context(passages)

    def replaced(reply: str, label: str) -> ChatResponse:
        log.info("output guardrail triggered: %s (model %s)", label, model)
        return ChatResponse(response=reply, model=model, guardrail=label)

    # 1. Scope. The model's own label decides first.
    scope, text = split_scope(text)
    if scope == SCOPE_OTHER:
        return replaced(REPLY_OFF_TOPIC, "off_topic")
    if scope == SCOPE_APP:
        return replaced(REPLY_APP_REFERRAL, "app_data")

    # 2. Medicines. No doses, and no medicine the retrieved knowledge does not name.
    if contains_dosage(text):
        return replaced(REPLY_NO_DOSING, "dosage")
    if find_unapproved_medicines(text, medicine_context):
        return replaced(REPLY_NO_MEDICINE, "medicine")

    body, cited = extract_sources(text)
    body = remove_unapproved_links(body)
    if not body:
        return replaced(REPLY_NO_ANSWER, "empty")

    # 3. Scope again, without trusting the label.
    if scope is None:
        log.warning("model left out the Scope line (model %s)", model)
    earlier = " ".join(m["content"] for m in messages[1:-1][-CONTEXT_TURNS:]) if scope else ""
    if not is_on_topic(question, body, earlier):
        if find_unapproved_medicines(question, medicine_context) or contains_dosage(question):
            return replaced(REPLY_NO_MEDICINE, "medicine")
        return replaced(REPLY_OFF_TOPIC, "off_topic")

    if is_pleasantry(question):
        return ChatResponse(response=body, model=model, sources=[])

    sources = _sources_for(passages, cited) if rag_on else cited
    return ChatResponse(response=body, model=model, sources=sources)
