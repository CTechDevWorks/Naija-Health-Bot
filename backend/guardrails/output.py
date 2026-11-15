"""
Server-side check on what the model wrote, before it reaches the user.

The assistant must never give medicine doses. The system prompt says so, but the
model is not trusted to obey it: an answer that contains a dose amount is
replaced with a fixed reply.

This is a conservative pattern match. It can also catch harmless amounts written
in milligrams (for example in nutrition advice); the cost is a refusal where an
answer would have been fine, which is the safer way to be wrong.
"""

from __future__ import annotations

import re

REPLY_NO_DOSING = (
    "I can't share specific medicine amounts or dosing. A doctor, pharmacist or "
    "other qualified health professional can recommend the right treatment and "
    "dose after seeing you. I can still help with general information on "
    "prevention, symptoms and when to get tested."
)

_DOSAGE = re.compile(
    r"""
      \b\d+(?:[.,]\d+)?\s*(?:mg|mcg|µg|milligrams?|micrograms?)\b
    | \b(?:\d+|one|two|three|four|half)\s+(?:tablets?|capsules?|caplets?|pills?)\b
    """,
    re.IGNORECASE | re.VERBOSE,
)


def contains_dosage(text: str) -> bool:
    return bool(_DOSAGE.search(text))
