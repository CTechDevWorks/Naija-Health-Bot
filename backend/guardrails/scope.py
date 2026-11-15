"""
Server-side input guardrails for the 9ja Health assistant.

Defence in depth — the system prompt does most of the steering, but nothing the
model says is trusted to enforce policy on its own. Before a request reaches the
model we:

  1. Sanitise the transcript — only user/assistant roles, trimmed, capped in
     length and count, system prompt injected exactly once at the top.
  2. Screen the latest user message. Possible emergencies and self-harm get a
     fixed reply that points to urgent care; clear-cut harmful requests and
     prompt-injection attempts get a fixed refusal. Matches never reach the model.

Everything here is deterministic and cheap. The emergency check is a keyword
match, NOT validated triage: it can miss real emergencies and it can fire on
ordinary questions that mention a serious symptom. It errs towards firing.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

from ai.base import Message
from config import settings

# ── Fixed replies ─────────────────────────────────────────────────────────

REPLY_EMERGENCY = (
    "This could be an emergency. Please get urgent medical help now: call 112, "
    "Nigeria's emergency number, or go to the nearest emergency department. "
    "If you can, ask someone nearby to stay with you. Do not wait for a reply "
    "from this chat. I can't assess or monitor anyone's condition."
)

REPLY_SELF_HARM = (
    "I'm really glad you told me, and I'm sorry things feel this heavy right now. "
    "I'm a health information assistant, not a counsellor, and you deserve support "
    "from a real person. Please reach out to someone you trust, or go to the nearest "
    "health facility. If you are in immediate danger, call 112, Nigeria's emergency "
    "number, right now."
)

REPLY_OFF_LIMITS = (
    "That's outside what I can help with. I'm here for health information, such as "
    "how malaria spreads, how to prevent mosquito bites, common symptoms, and when "
    "to get tested or see a health professional."
)

REPLY_INJECTION = (
    "I can't change how I work or step outside health information. "
    "What health topic can I help you with?"
)

# ── Patterns ──────────────────────────────────────────────────────────────
# The harmful-request patterns are intentionally tight so ordinary health
# questions (sexual health, drug safety, injuries) still reach the model.


def _rx(pattern: str) -> re.Pattern[str]:
    return re.compile(pattern, re.IGNORECASE | re.VERBOSE)


_SELF_HARM = _rx(
    r"""
    \b( kill\s+myself | end\s+my\s+life | want\s+to\s+die | suicid(e|al)
      | self[-\s]?harm | hurt\s+myself | cut\s+myself | overdose\s+on ) \b
    """
)

_EMERGENCY = _rx(
    r"""
    \b( can'?t\s+breathe | cannot\s+breathe
      | (difficulty|trouble|struggling)\s+(with\s+)?breathing
      | chest\s+pains?
      | unconscious | unresponsive | passed\s+out | (won'?t|not)\s+wak(e|ing)\s+up
      | seizures? | convulsi(on|ons|ng)
      | sever(e|ely)\s+bleeding | bleeding\s+(heavily|a\s+lot)
      | overdos(e|ed|ing) ) \b
    """
)

_INJECTION = _rx(
    r"""
    ( ignore\s+(all\s+)?(the\s+)?(previous|prior|above|earlier)\s+(instructions?|prompts?|rules?)
      | disregard\s+(your|the)\s+(system\s+)?(prompt|instructions?|rules?)
      | (reveal|show|print|repeat|output)\s+(me\s+)?(your|the)\s+(system\s+)?(prompt|instructions?)
      | you\s+are\s+now\s+(dan|an?\s+unrestricted|an?\s+uncensored|free\s+of)
      | (enter|enable|activate)\s+(developer|dev|god|jailbreak)\s+mode
      | pretend\s+(you\s+)?(have|are)\s+no\s+(rules|restrictions|guidelines)
      | from\s+now\s+on\s+you\s+(will|can|must)\s+(answer|respond\s+to)\s+(anything|everything) )
    """
)

_SEXUAL = _rx(
    r"""
    \b( porn(ography)? | sexting | hentai | erotic(a)?
      | explicit\s+(story|content|roleplay)
      | (write|tell)\s+(me\s+)?(a\s+)?(sex|sexual|erotic)\s+(story|scene) ) \b
    """
)

_WEAPONS = _rx(
    r"""
    \b( (how\s+(to|do\s+i)\s+)?(make|build|assemble|create|manufacture)\s+(a\s+)?
        (bomb|explosive|pipe\s*bomb|ied|molotov|grenade|gun|firearm|silencer|ghost\s+gun)
      | synthesi[sz]e\s+(a\s+)?(nerve\s+agent|sarin|ricin|vx|mustard\s+gas) ) \b
    """
)

_ILLICIT_DRUGS = _rx(
    r"""
    \b( (how\s+(to|do\s+i)\s+)?(cook|make|synthesi[sz]e|manufacture|produce|extract)\s+
        (meth(amphetamine)?|crack|cocaine|heroin|fentanyl|mdma|ecstasy|lsd|dmt|codeine\s+syrup)
      | (where|how)\s+(to|can\s+i)\s+(buy|get|score)\s+(weed|cocaine|meth|molly|tramadol|codeine) ) \b
    """
)

_CYBERCRIME = _rx(
    r"""
    \b( (write|create|build|make)\s+(me\s+)?(a\s+)?(ransomware|malware|keylogger|trojan|virus|botnet|phishing\s+(page|site|email))
      | (hack|break)\s+into\s+(someone'?s|a)\s+(account|phone|whatsapp|instagram|facebook|email)
      | (steal|dump)\s+(credit\s+card|bank)\s+(numbers|details|data) ) \b
    """
)

_HATE = _rx(
    r"""
    \b( (write|make)\s+(a\s+)?(racist|homophobic|tribalistic|sexist)\s+(joke|rant|speech|post) ) \b
    """
)

# (label, pattern, reply, urgent). Order matters: the first match wins, so the
# care-seeking replies are checked before the refusals.
_RULES: tuple[tuple[str, re.Pattern[str], str, bool], ...] = (
    ("self_harm", _SELF_HARM, REPLY_SELF_HARM, True),
    ("emergency", _EMERGENCY, REPLY_EMERGENCY, True),
    ("injection", _INJECTION, REPLY_INJECTION, False),
    ("sexual", _SEXUAL, REPLY_OFF_LIMITS, False),
    ("weapons", _WEAPONS, REPLY_OFF_LIMITS, False),
    ("illicit_drugs", _ILLICIT_DRUGS, REPLY_OFF_LIMITS, False),
    ("cybercrime", _CYBERCRIME, REPLY_OFF_LIMITS, False),
    ("hate", _HATE, REPLY_OFF_LIMITS, False),
)


# ── Public API ────────────────────────────────────────────────────────────


class InvalidTranscript(ValueError):
    """The client sent a conversation the assistant cannot answer."""


@dataclass(frozen=True)
class GuardrailVerdict:
    blocked: bool
    label: str | None = None
    reply: str | None = None
    urgent: bool = False


def screen_input(text: str) -> GuardrailVerdict:
    """Fixed-reply check on the newest user message."""
    # Phones type a curly apostrophe ("can’t"); the patterns expect a straight one.
    normalised = re.sub(r"\s+", " ", text.replace("\u2019", "'")).strip()
    for label, pattern, reply, urgent in _RULES:
        if pattern.search(normalised):
            return GuardrailVerdict(blocked=True, label=label, reply=reply, urgent=urgent)
    return GuardrailVerdict(blocked=False)


def build_conversation(history: list[dict], system_prompt: str) -> list[Message]:
    """
    Turn the client transcript into the exact message list sent to the model.

    - Drops anything that isn't a user/assistant turn (clients cannot inject
      system messages).
    - Trims whitespace, truncates over-long messages, keeps only the most
      recent N turns, and guarantees the last turn is from the user.
    - Puts the system prompt first, once.
    """
    cleaned: list[Message] = []
    for item in history:
        role = item.get("role")
        content = (item.get("content") or "").strip()
        if role not in ("user", "assistant") or not content:
            continue
        if len(content) > settings.max_message_chars:
            content = content[: settings.max_message_chars] + " …"
        cleaned.append({"role": role, "content": content})

    if not cleaned or cleaned[-1]["role"] != "user":
        raise InvalidTranscript("The last message must come from the user.")

    recent = cleaned[-settings.max_history_messages :]
    return [{"role": "system", "content": system_prompt}, *recent]
