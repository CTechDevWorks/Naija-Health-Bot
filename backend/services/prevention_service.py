"""
Prevention pipeline: validate location → features → ML → category → tips.
"""

from __future__ import annotations

from datetime import datetime, timezone

from ml.feature_builder import (
    FeatureBuildError,
    build_features,
    validate_coordinates,
)
from ml.malaria_model import (
    MalariaModel,
    ModelUnavailableError,
    get_malaria_model,
)
from schemas import (
    PreventionFactor,
    PreventionRequest,
    PreventionResponse,
    PreventionSource,
    PreventionTipItem,
)
from services.prevention_rules import select_tips


class PreventionError(Exception):
    """User-facing Prevention failure with an HTTP-friendly message."""

    def __init__(self, message: str, status_code: int = 400) -> None:
        super().__init__(message)
        self.status_code = status_code


def _factors(features, category: str) -> list[PreventionFactor]:
    return [
        PreventionFactor(
            label="Previous-year mean temperature",
            detail=(
                f"{features.temperature:.1f} °C in {features.feature_year} "
                "(NASA POWER annual mean)."
            ),
        ),
        PreventionFactor(
            label="Previous-year rainfall",
            detail=(
                f"{features.rainfall:.0f} mm total in {features.feature_year} "
                "(NASA POWER)."
            ),
        ),
        PreventionFactor(
            label="Previous-year mean humidity",
            detail=(
                f"{features.humidity:.1f}% in {features.feature_year} "
                "(NASA POWER)."
            ),
        ),
        PreventionFactor(
            label="Previous-year mean wind speed",
            detail=(
                f"{features.wind_speed:.2f} m/s in {features.feature_year} "
                "(NASA POWER)."
            ),
        ),
        PreventionFactor(
            label="Previous-year malaria incidence",
            detail=(
                f"{features.previous_incidence:.1f} cases per 1,000 in "
                f"{features.feature_year} (Malaria Atlas Project). "
                f"Model category for this estimate: {category}."
            ),
        ),
    ]


def run_prevention(
    request: PreventionRequest,
    model: MalariaModel | None = None,
) -> PreventionResponse:
    malaria = model or get_malaria_model()
    if not malaria.ready:
        raise PreventionError(
            "The malaria model is not available on the server yet.",
            status_code=503,
        )

    try:
        validate_coordinates(request.latitude, request.longitude)
        features = build_features(request.state)
    except FeatureBuildError as err:
        raise PreventionError(str(err), status_code=422) from err

    try:
        incidence = malaria.predict_incidence(features)
    except ModelUnavailableError as err:
        raise PreventionError(str(err), status_code=503) from err

    category = malaria.category_for(incidence)
    tips = select_tips(category, features)
    meta = malaria.metadata
    sources_raw = meta.get("sources") or []
    sources = [
        PreventionSource(
            id=str(item.get("id", "")),
            title=str(item.get("title", "")),
            organisation=str(item.get("organisation", "")),
            url=str(item.get("url", "")),
        )
        for item in sources_raw
        if item.get("id") and item.get("title")
    ]
    limitations = [str(item) for item in (meta.get("limitations") or [])]

    return PreventionResponse(
        state=features.app_state,
        incidence_per_1000=round(incidence, 1),
        category=category,
        period=f"Calendar year {features.prediction_year}",
        prediction_year=features.prediction_year,
        feature_year=features.feature_year,
        factors=_factors(features, category),
        tips=[
            PreventionTipItem(
                id=tip.id,
                title=tip.title,
                body=tip.body,
                group=tip.group,
            )
            for tip in tips
        ],
        model_version=malaria.version,
        updated_at=datetime.now(timezone.utc).isoformat(),
        sources=sources,
        limitations=limitations,
        disclaimer=(
            "Area-level estimate only — not your personal chance of illness, "
            "and not a diagnosis."
        ),
    )
