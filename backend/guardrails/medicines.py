"""
Server-side check that the assistant only names medicines the knowledge base names.

The system prompt tells the model which treatment it may mention, but the model
is not trusted to obey it. An answer that names any medicine on the list in
`knowledge_base/medicine_names.json` is replaced with a fixed reply, unless the
knowledge passage the answer was built from names that medicine too.

Until retrieval is wired in there is no passage, so every listed name is
blocked. Once it is, pass the retrieved text as `allowed_context` and a medicine
becomes nameable exactly when the knowledge base names it.

Limits worth knowing:
  * This is a name list, not a pharmacology check. A medicine that is not on the
    list is not caught.
  * It fires on any mention, including "chloroquine is no longer recommended".
    The cost is a refusal where a careful answer would have been fine.
"""

from __future__ import annotations

import json
import re
from functools import lru_cache

from config import settings

REPLY_NO_MEDICINE = (
    "I can't recommend or comment on specific medicines. For malaria, the first "
    "step is a test. If it is positive, a doctor, pharmacist or other qualified "
    "health worker will choose the right medicine and amount for you. I can still "
    "help with how malaria spreads, prevention, symptoms and when to get tested."
)


@lru_cache(maxsize=1)
def _lexicon() -> re.Pattern[str]:
    raw = json.loads(settings.medicine_names_path.read_text(encoding="utf-8"))
    names = {
        name.strip().lower()
        for group, items in raw.items()
        if not group.startswith("_")
        for name in items
        if name.strip()
    }
    # Longest first, so "co-trimoxazole" wins over any shorter name inside it.
    alternatives = "|".join(re.escape(n) for n in sorted(names, key=len, reverse=True))
    return re.compile(rf"(?<![a-z0-9])(?:{alternatives})(?![a-z0-9])", re.IGNORECASE)


def _named(text: str) -> set[str]:
    return {match.group(0).lower() for match in _lexicon().finditer(text)}


def find_unapproved_medicines(text: str, allowed_context: str = "") -> list[str]:
    """Listed medicines named in `text` that `allowed_context` does not name."""
    return sorted(_named(text) - _named(allowed_context))
