"""Load the packaged Prevention model once and run change → incidence inference."""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

import joblib
import pandas as pd

from ml.feature_builder import InferenceFeatures

log = logging.getLogger("naija_health.ml")

ML_DIR = Path(__file__).resolve().parent
MODEL_PATH = ML_DIR / "model.joblib"
METADATA_PATH = ML_DIR / "model_metadata.json"

_FEATURE_COLUMNS = [
    "Name",
    "temperature",
    "rainfall",
    "humidity",
    "wind_speed",
    "previous_incidence",
]


class ModelUnavailableError(RuntimeError):
    """Raised when the model artefact cannot be loaded or used."""


class MalariaModel:
    def __init__(self) -> None:
        self._pipeline: Any | None = None
        self._metadata: dict[str, Any] | None = None

    @property
    def ready(self) -> bool:
        return self._pipeline is not None and self._metadata is not None

    @property
    def metadata(self) -> dict[str, Any]:
        if self._metadata is None:
            raise ModelUnavailableError("Malaria model metadata is not loaded.")
        return self._metadata

    @property
    def version(self) -> str:
        return str(self.metadata.get("model_version", "unknown"))

    def load(self) -> None:
        if not MODEL_PATH.is_file():
            raise ModelUnavailableError(
                f"Model file missing: {MODEL_PATH}. Run scripts.train_prevention_model."
            )
        if not METADATA_PATH.is_file():
            raise ModelUnavailableError(
                f"Metadata file missing: {METADATA_PATH}."
            )
        self._pipeline = joblib.load(MODEL_PATH)
        self._metadata = json.loads(METADATA_PATH.read_text(encoding="utf-8"))
        log.info("Loaded malaria model %s", self.version)

    def predict_incidence(self, features: InferenceFeatures) -> float:
        if self._pipeline is None:
            raise ModelUnavailableError("Malaria model is not loaded.")
        frame = pd.DataFrame([features.as_model_row()], columns=_FEATURE_COLUMNS)
        change = float(self._pipeline.predict(frame)[0])
        return float(features.previous_incidence + change)

    def category_for(self, incidence: float) -> str:
        cutoffs = self.metadata.get("category_cutoffs") or {}
        q25 = float(cutoffs.get("q25", 0))
        q50 = float(cutoffs.get("q50", 0))
        q75 = float(cutoffs.get("q75", 0))
        if incidence <= q25:
            return "Low"
        if incidence <= q50:
            return "Moderate"
        if incidence <= q75:
            return "Elevated"
        return "High"


_model = MalariaModel()


def get_malaria_model() -> MalariaModel:
    return _model


def load_malaria_model() -> None:
    """Called from app lifespan. Soft-fails so chat still works without the artefact."""
    try:
        _model.load()
    except ModelUnavailableError as err:
        log.error("Malaria model not available: %s", err)
