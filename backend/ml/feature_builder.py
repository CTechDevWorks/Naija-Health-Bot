"""
Build inference features for the Prevention malaria model.

Uses previous-calendar-year NASA POWER climate and MAP incidence — not live
hourly weather. App state labels are mapped onto dataset spellings.
"""

from __future__ import annotations

import csv
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
REPO_ROOT = BACKEND_DIR.parent
DATA_DIR = REPO_ROOT / "nasa_power_yearly"
CLIMATE_CSV = DATA_DIR / "climate_annual_all_states.csv"
INCIDENCE_CSV = DATA_DIR / "malaria_incidence.csv"

# App picker label → climate CSV Name / incidence CSV Name
APP_TO_CLIMATE: dict[str, str] = {
    "FCT Abuja": "Abuja Federal Capital Territory",
}
APP_TO_INCIDENCE: dict[str, str] = {
    "FCT Abuja": "Abuja",
    "Nasarawa": "Nassarawa",
}

APP_STATES = frozenset(
    {
        "Abia",
        "Adamawa",
        "Akwa Ibom",
        "Anambra",
        "Bauchi",
        "Bayelsa",
        "Benue",
        "Borno",
        "Cross River",
        "Delta",
        "Ebonyi",
        "Edo",
        "Ekiti",
        "Enugu",
        "FCT Abuja",
        "Gombe",
        "Imo",
        "Jigawa",
        "Kaduna",
        "Kano",
        "Katsina",
        "Kebbi",
        "Kogi",
        "Kwara",
        "Lagos",
        "Nasarawa",
        "Niger",
        "Ogun",
        "Ondo",
        "Osun",
        "Oyo",
        "Plateau",
        "Rivers",
        "Sokoto",
        "Taraba",
        "Yobe",
        "Zamfara",
    }
)

# Model one-hot Name column (incidence / experiment_data spelling)
APP_TO_MODEL_NAME: dict[str, str] = {
    "FCT Abuja": "Abuja",
    "Nasarawa": "Nassarawa",
}

# Rough Nigeria bounding box for coordinate sanity checks.
NIGERIA_LAT = (3.5, 14.5)
NIGERIA_LON = (2.5, 15.0)


class FeatureBuildError(ValueError):
    """Raised when features cannot be built for a request."""


@dataclass(frozen=True)
class InferenceFeatures:
    app_state: str
    model_name: str
    prediction_year: int
    feature_year: int
    temperature: float
    rainfall: float
    humidity: float
    wind_speed: float
    previous_incidence: float

    def as_model_row(self) -> dict[str, float | str]:
        return {
            "Name": self.model_name,
            "temperature": self.temperature,
            "rainfall": self.rainfall,
            "humidity": self.humidity,
            "wind_speed": self.wind_speed,
            "previous_incidence": self.previous_incidence,
        }


def normalize_app_state(raw: str) -> str | None:
    cleaned = raw.strip().replace(" State", "").replace(" state", "")
    if cleaned in APP_STATES:
        return cleaned
    lower = cleaned.lower()
    for state in APP_STATES:
        if state.lower() == lower:
            return state
    aliases = {
        "abuja": "FCT Abuja",
        "federal capital territory": "FCT Abuja",
        "fct": "FCT Abuja",
        "fct abuja": "FCT Abuja",
        "nassarawa": "Nasarawa",
    }
    return aliases.get(lower)


def validate_coordinates(latitude: float, longitude: float) -> None:
    if not (isinstance(latitude, (int, float)) and isinstance(longitude, (int, float))):
        raise FeatureBuildError("Latitude and longitude must be numbers.")
    if not (NIGERIA_LAT[0] <= latitude <= NIGERIA_LAT[1]):
        raise FeatureBuildError("Coordinates are outside Nigeria.")
    if not (NIGERIA_LON[0] <= longitude <= NIGERIA_LON[1]):
        raise FeatureBuildError("Coordinates are outside Nigeria.")


@lru_cache(maxsize=1)
def _climate_index() -> dict[tuple[str, int], dict[str, float]]:
    if not CLIMATE_CSV.is_file():
        raise FeatureBuildError("Climate data file is missing on the server.")
    index: dict[tuple[str, int], dict[str, float]] = {}
    with CLIMATE_CSV.open(encoding="utf-8", newline="") as handle:
        for row in csv.DictReader(handle):
            key = (row["Name"], int(row["weather_year"]))
            index[key] = {
                "temperature": float(row["temperature"]),
                "rainfall": float(row["rainfall"]),
                "humidity": float(row["humidity"]),
                "wind_speed": float(row["wind_speed"]),
            }
    return index


@lru_cache(maxsize=1)
def _incidence_index() -> dict[tuple[str, int], float]:
    if not INCIDENCE_CSV.is_file():
        raise FeatureBuildError("Malaria incidence data file is missing on the server.")
    index: dict[tuple[str, int], float] = {}
    with INCIDENCE_CSV.open(encoding="utf-8", newline="") as handle:
        for row in csv.DictReader(handle):
            if row["Metric"] != "Incidence Rate":
                continue
            if row["Units"] != "Cases per Thousand":
                continue
            key = (row["Name"], int(row["Year"]))
            index[key] = float(row["Value"])
    return index


def latest_feature_year() -> int:
    """Most recent year present in both climate and incidence tables."""
    climate_years = {year for (_, year) in _climate_index()}
    incidence_years = {year for (_, year) in _incidence_index()}
    shared = climate_years & incidence_years
    if not shared:
        raise FeatureBuildError("No overlapping climate and incidence years.")
    return max(shared)


def build_features(app_state: str, *, feature_year: int | None = None) -> InferenceFeatures:
    state = normalize_app_state(app_state)
    if state is None:
        raise FeatureBuildError("Unknown Nigerian state or FCT.")

    year = feature_year if feature_year is not None else latest_feature_year()
    climate_name = APP_TO_CLIMATE.get(state, state)
    incidence_name = APP_TO_INCIDENCE.get(state, state)
    model_name = APP_TO_MODEL_NAME.get(state, state)

    climate = _climate_index().get((climate_name, year))
    if climate is None:
        raise FeatureBuildError(
            f"No climate data for {state} in {year}."
        )

    previous_incidence = _incidence_index().get((incidence_name, year))
    if previous_incidence is None:
        raise FeatureBuildError(
            f"No malaria incidence data for {state} in {year}."
        )

    return InferenceFeatures(
        app_state=state,
        model_name=model_name,
        prediction_year=year + 1,
        feature_year=year,
        temperature=climate["temperature"],
        rainfall=climate["rainfall"],
        humidity=climate["humidity"],
        wind_speed=climate["wind_speed"],
        previous_incidence=previous_incidence,
    )
