"""
Deterministic Prevention tips from model category and previous-year climate.

No LLM. Wording stays general — nets, standing water, testing — never doses.
"""

from __future__ import annotations

from dataclasses import dataclass

from ml.feature_builder import InferenceFeatures


@dataclass(frozen=True)
class PreventionTip:
    id: str
    title: str
    body: str
    group: str


# Base tips aligned with the app's locked prevention groups.
_TIPS: list[PreventionTip] = [
    PreventionTip(
        id="water",
        title="Empty standing water",
        body="Check buckets, plant pots and gutters around your home.",
        group="Around the home",
    ),
    PreventionTip(
        id="screens",
        title="Check your window screens",
        body="Repair gaps that could let mosquitoes indoors.",
        group="Around the home",
    ),
    PreventionTip(
        id="net",
        title="Sleep under an insecticide-treated net",
        body="Use it each night and check that it is tucked in properly.",
        group="When sleeping",
    ),
    PreventionTip(
        id="clothes",
        title="Cover up from dusk to dawn",
        body="Long sleeves and trousers can help reduce mosquito bites.",
        group="Out and about",
    ),
    PreventionTip(
        id="repellent",
        title="Use an appropriate repellent",
        body="Follow the product label and seek advice for young children.",
        group="Out and about",
    ),
    PreventionTip(
        id="test",
        title="Ask a health professional about testing",
        body=(
            "Fever, headache and chills can have different causes. "
            "Testing matters."
        ),
        group="If someone feels unwell",
    ),
]

# Higher previous-year rainfall → emphasise standing water and outdoor protection.
_WET_YEAR_MM = 1500.0


def select_tips(category: str, features: InferenceFeatures) -> list[PreventionTip]:
    """Order tips by relevance; never invent medical treatment advice."""
    wet = features.rainfall >= _WET_YEAR_MM
    elevated = category in {"Elevated", "High"}

    priority: dict[str, int] = {tip.id: 50 for tip in _TIPS}
    priority["net"] = 10 if elevated else 30
    priority["test"] = 15 if elevated else 40
    priority["water"] = 5 if wet else 35
    priority["screens"] = 20 if wet or elevated else 45
    priority["clothes"] = 25 if wet else 48
    priority["repellent"] = 28 if elevated else 49

    ordered = sorted(_TIPS, key=lambda tip: (priority[tip.id], tip.id))
    # Always return a full, stable set so the UI can show the checklist.
    return ordered
