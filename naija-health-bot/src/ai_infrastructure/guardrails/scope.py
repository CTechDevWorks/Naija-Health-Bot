"""
Server-side guardrails for Kadet.

Defence in depth — the system prompt does most of the steering, but nothing the
model says is trusted to enforce policy on its own. Before a request reaches the
model we:

  1. Sanitise the transcript — only user/assistant roles, trimmed, capped in
     length and count, system prompt injected exactly once at the top.
  2. Screen the latest user message for hard-blocked categories (sexual content,
     weapons/explosives, drug synthesis, self-harm, malware, gambling tips,
     hate/harassment) and for prompt-injection attempts. Matches never reach the
     model; a fixed reply is returned instead.

Everything here is deterministic and cheap. It is deliberately conservative
about *what* it blocks (clear-cut harm + jailbreaks) and leaves the softer
"is this education?" judgement to the prompt, which handles nuance far better
than regex can.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from functools import lru_cache

from config import settings
from ai.base import Message

# ── Canned replies ────────────────────────────────────────────────────────

REPLY_OFF_LIMITS = (
    "That's outside what I can help with, kadet — I'm here strictly for school work and "
    "exam prep. Ask me anything on your syllabus: a Maths problem, an English essay "
    "structure, a Biology topic, or how to plan your revision, and I'm all in."
)

REPLY_SELF_HARM = (
    "I'm really glad you told me, and I'm sorry things feel this heavy right now. "
    "I'm a study companion, not a counsellor, but you deserve real support from a "
    "person — please reach out to someone you trust, or a helpline: in Nigeria, the "
    "Mentally Aware Nigeria Initiative on 0809 111 6264 (SURPIN 0902 741 5555 / 0908 021 7555 / 0902 740 6003); "
    "in Ghana, the Mental Health Authority on 0800 678 678; in Kenya, Befrienders on 0722 178 177. "
    "If you're in immediate danger, call your local emergency number. "
    "When you're ready, I'm right here to help with your school work."
)

REPLY_INJECTION = (
    "Nice try, kadet 🙂 I can't change my rules or step outside education. "
    "What subject shall we work on?"
)

# ── Patterns ──────────────────────────────────────────────────────────────
# Kept intentionally tight to avoid false positives on legitimate schoolwork
# (Biology reproduction, History of wars, Chemistry of explosives *as theory*,
# etc.). Each tuple: (label, compiled regex, reply).


def _rx(pattern: str) -> re.Pattern[str]:
    return re.compile(pattern, re.IGNORECASE | re.VERBOSE)


_SELF_HARM = _rx(
    r"""
    \b( kill\s+myself | end\s+my\s+life | want\s+to\s+die | suicid(e|al)
      | self[-\s]?harm | hurt\s+myself | cut\s+myself | overdose\s+on ) \b
    """
)

_SEXUAL = _rx(
    r"""
    \b( porn(ography)? | sexting | nudes? | naked\s+(pictures?|photos?)
      | explicit\s+(story|content|roleplay) | erotic(a)? | hentai
      | (write|tell)\s+(me\s+)?(a\s+)?(sex|sexual|erotic)\s+(story|scene) ) \b
    """
)

_WEAPONS = _rx(
    r"""
    \b( (how\s+(to|do\s+i)\s+)?(make|build|assemble|create|manufacture)\s+(a\s+)?
        (bomb|explosive|pipe\s*bomb|ied|molotov|grenade|gun|firearm|silencer|ghost\s+gun)
      | synthesi[sz]e\s+(a\s+)?(nerve\s+agent|sarin|ricin|vx|mustard\s+gas)
      | (buy|get|obtain)\s+(a\s+)?(gun|firearm|pistol|rifle)\s+(illegally|without\s+(a\s+)?licen[cs]e) ) \b
    """
)

_DRUGS = _rx(
    r"""
    \b( (how\s+(to|do\s+i)\s+)?(cook|make|synthesi[sz]e|manufacture|produce|extract)\s+
        (meth(amphetamine)?|crack|cocaine|heroin|fentanyl|mdma|ecstasy|lsd|dmt|codeine\s+syrup)
      | (where|how)\s+(to|can\s+i)\s+(buy|get|score)\s+(weed|cocaine|meth|molly|tramadol|codeine)\b ) \b
    """
)

_CYBERCRIME = _rx(
    r"""
    \b( (write|create|build|make)\s+(me\s+)?(a\s+)?(ransomware|malware|keylogger|trojan|virus|botnet|phishing\s+(page|site|email))
      | (hack|break)\s+into\s+(someone'?s|my\s+(ex|girlfriend|boyfriend)'?s|a)\s+(account|phone|whatsapp|instagram|facebook|email)
      | (steal|dump)\s+(credit\s+card|bank)\s+(numbers|details|data)
      | yahoo\s+yahoo\s+format | 419\s+format | dating\s+format\s+for\s+(clients?|scam) ) \b
    """
)

_GAMBLING = _rx(
    r"""
    \b( (sure|fixed|guaranteed)\s+(odds|games?|bets?|predictions?) | bet9ja | sportybet | betking
      | (football|soccer|match)\s+predictions?\s+(for\s+)?(today|tonight|tomorrow)
      | (how\s+to\s+)?win\s+(at\s+)?(betting|casino|slots|baccarat|roulette) ) \b
    """
)

_HATE = _rx(
    r"""
    \b( (write|make)\s+(a\s+)?(racist|homophobic|tribalistic|sexist)\s+(joke|rant|speech|post)
      | (why|prove)\s+(are\s+)?(\w+\s+)?(igbo|yoruba|hausa|fulani|ewe|akan|asante|ga)\s+(people\s+)?(are\s+)?(inferior|stupid|evil|criminals) ) \b
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

_RULES: tuple[tuple[str, re.Pattern[str], str], ...] = (
    ("self_harm", _SELF_HARM, REPLY_SELF_HARM),
    ("injection", _INJECTION, REPLY_INJECTION),
    ("sexual", _SEXUAL, REPLY_OFF_LIMITS),
    ("weapons", _WEAPONS, REPLY_OFF_LIMITS),
    ("drugs", _DRUGS, REPLY_OFF_LIMITS),
    ("cybercrime", _CYBERCRIME, REPLY_OFF_LIMITS),
    ("gambling", _GAMBLING, REPLY_OFF_LIMITS),
    ("hate", _HATE, REPLY_OFF_LIMITS),
)


# ── Public API ────────────────────────────────────────────────────────────


@dataclass(frozen=True)
class GuardrailVerdict:
    blocked: bool
    label: str | None = None
    reply: str | None = None


def screen_input(text: str) -> GuardrailVerdict:
    """Hard-block check on the newest user message."""
    normalised = re.sub(r"\s+", " ", text).strip()
    for label, pattern, reply in _RULES:
        if pattern.search(normalised):
            return GuardrailVerdict(blocked=True, label=label, reply=reply)
    return GuardrailVerdict(blocked=False)


@lru_cache(maxsize=1)
def load_system_prompt() -> str:
    path = settings.prompts_dir / "system_prompt.md"
    return path.read_text(encoding="utf-8").strip()


def build_conversation(history: list[dict]) -> list[Message]:
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
        raise ValueError("The last message must come from the user.")

    recent = cleaned[-settings.max_history_messages :]
    return [{"role": "system", "content": load_system_prompt()}, *recent]
