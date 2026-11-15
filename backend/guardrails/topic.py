"""
Keeping the assistant to malaria.

The model is asked to start every reply with a line that classifies the user's
message:

    Scope: malaria   answer normally
    Scope: app       asks for live information that only the app's screens have
    Scope: other     anything else

The server reads that line and decides what the user sees. For `app` and `other`
the model's text is thrown away and a fixed reply is sent, so a partly-compliant
answer can never slip through.

The label comes from the model, so it is backed by a deterministic check: an
answer is only let through if the question, the answer or the turns just before
them actually mention malaria vocabulary. A reply with no label has to pass on
the question and answer alone.

Limits worth knowing:
  * A determined user can still get a non-malaria answer that happens to mention
    malaria past both checks.
  * Once a conversation is about malaria, the backstop no longer bites for the
    next couple of turns; only the model's label stands between an off-topic
    question and an answer.
This narrows the assistant; it does not make off-topic output impossible.
"""

from __future__ import annotations

import re

SCOPE_MALARIA = "malaria"
SCOPE_APP = "app"
SCOPE_OTHER = "other"

REPLY_OFF_TOPIC = (
    "I can only help with questions about malaria: how it spreads, preventing "
    "mosquito bites, symptoms, testing and when to see a health professional. "
    "For any other health concern, please speak to a doctor, pharmacist or other "
    "qualified health professional."
)

REPLY_APP_REFERRAL = (
    "I don't have live information, so I can't tell you today's weather, the "
    "current malaria outlook for your area or the latest health updates. You can "
    "find them in the app: the Home tab shows current conditions, the Outlook tab "
    "shows the malaria outlook for your area, and the Updates tab has notices "
    "from health authorities. I can explain how weather affects malaria or what "
    "an outlook means if that would help."
)

# A whole line such as "Scope: malaria", "**Scope:** other" or "scope - app".
_SCOPE_LINE = re.compile(r"^\W*scope\W+(?P<label>[a-z][a-z_\- ]*?)\W*$", re.IGNORECASE)

_LABELS = {
    "malaria": SCOPE_MALARIA,
    "app": SCOPE_APP,
    "app data": SCOPE_APP,
    "app_data": SCOPE_APP,
    "other": SCOPE_OTHER,
    "off topic": SCOPE_OTHER,
    "off-topic": SCOPE_OTHER,
    "off_topic": SCOPE_OTHER,
}


def split_scope(text: str) -> tuple[str | None, str]:
    """
    Split the model's reply into (scope label, reply without any Scope line).

    The label is None when the model left the line out or wrote something that
    is not one of the three labels.
    """
    label: str | None = None
    kept: list[str] = []
    for line in text.split("\n"):
        match = _SCOPE_LINE.match(line.strip())
        if not match:
            kept.append(line)
            continue
        if label is None:
            label = _LABELS.get(match.group("label").strip().lower())
    return label, "\n".join(kept).strip()


_MALARIA_VOCABULARY = re.compile(
    r"""
    \b( malaria\w* | antimalarial\w* | mosquito\w* | anopheles | plasmodium | fever\w*
      | (bed|mosquito|treated|insecticid\w+)[\s-]+nets? | bed\s?nets? | \bitns?\b | llins?
      | insecticid\w+ | repellents? | larva\w* | larvicid\w+
      | (stagnant|standing)\s+water | breeding\s+(sites?|places?|grounds?)
      | artemisinin\w* | rapid\s+(diagnostic\s+)?tests? | rdts?
      | area[-\s]level | outlook ) \b
    """,
    re.IGNORECASE | re.VERBOSE,
)

_PLEASANTRY = re.compile(
    r"""
    ^\W*( hi | hello | hey | good\s+(morning|afternoon|evening|day)
        | how\s+(are\s+you|far|you\s+dey) | thanks?(\s+you)?(\s+(so|very)\s+much)?
        | thank\s+you | ok(ay)? | alright | bye | goodbye | you'?re\s+welcome )
        (\s+(there|o|oo|sir|ma|please|again))?\W*$
    """,
    re.IGNORECASE | re.VERBOSE,
)


def mentions_malaria(text: str) -> bool:
    return bool(_MALARIA_VOCABULARY.search(text))


def is_pleasantry(text: str) -> bool:
    """A greeting or thanks on its own, which deserves a short friendly reply."""
    return bool(_PLEASANTRY.match(text.strip()))


def is_on_topic(user_message: str, reply: str, earlier_turns: str = "") -> bool:
    """
    Deterministic backstop behind the model's own `Scope:` label.

    `earlier_turns` is the text of the turns just before this one. Pass it only
    when the model labelled the reply as malaria: a follow-up such as "what
    about children?" has no malaria word of its own, and neither may its answer.
    Leave it empty when the label is missing, so an unlabelled reply has to
    stand on its own.
    """
    return (
        is_pleasantry(user_message)
        or mentions_malaria(user_message)
        or mentions_malaria(reply)
        or mentions_malaria(earlier_turns)
    )
