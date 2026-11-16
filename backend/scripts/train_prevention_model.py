"""
Train the Prevention malaria model (gradient boosting on year-to-year change).

Run from the backend folder:
    python -m scripts.train_prevention_model

Writes:
    backend/ml/model.joblib
    backend/ml/model_metadata.json
"""

from __future__ import annotations

import json
from datetime import date, datetime, timezone
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

BACKEND_DIR = Path(__file__).resolve().parents[1]
REPO_ROOT = BACKEND_DIR.parent
DATA_PATH = REPO_ROOT / "nasa_power_yearly" / "experiment_data.csv"
ML_DIR = BACKEND_DIR / "ml"
MODEL_PATH = ML_DIR / "model.joblib"
METADATA_PATH = ML_DIR / "model_metadata.json"

FEATURES = [
    "Name",
    "temperature",
    "rainfall",
    "humidity",
    "wind_speed",
    "previous_incidence",
]
NUMERIC = ["temperature", "rainfall", "humidity", "wind_speed", "previous_incidence"]
MODEL_VERSION = "gb-change-v1"

# Report hold-out figures (train through 2020, test 2021–2025).
PUBLISHED_HOLDOUT = {
    "Average Baseline": {"MAE": 99.756, "RMSE": 110.416, "R2": -1.708},
    "Previous-Year Baseline": {"MAE": 19.245, "RMSE": 25.442, "R2": 0.856},
    "Model 1: State + Weather": {"MAE": 79.815, "RMSE": 98.085, "R2": -1.137},
    "Model 2: State + Weather + Previous Incidence": {
        "MAE": 20.725,
        "RMSE": 26.863,
        "R2": 0.840,
    },
    "Model 3: Ridge": {"MAE": 22.513, "RMSE": 30.653, "R2": 0.791},
    "Model 4: Gradient Boosting": {"MAE": 20.258, "RMSE": 26.092, "R2": 0.84},
}


def _evaluate(actual: np.ndarray, predicted: np.ndarray) -> dict[str, float]:
    return {
        "MAE": round(float(mean_absolute_error(actual, predicted)), 3),
        "RMSE": round(float(np.sqrt(mean_squared_error(actual, predicted))), 3),
        "R2": round(float(r2_score(actual, predicted)), 3),
    }


def _build_pipeline() -> Pipeline:
    preprocessor = ColumnTransformer(
        transformers=[
            ("state", OneHotEncoder(handle_unknown="ignore"), ["Name"]),
            ("numeric", "passthrough", NUMERIC),
        ]
    )
    return Pipeline(
        steps=[
            ("preprocessing", preprocessor),
            (
                "regressor",
                GradientBoostingRegressor(
                    n_estimators=150,
                    learning_rate=0.03,
                    max_depth=2,
                    random_state=42,
                ),
            ),
        ]
    )


def _load_experiment() -> pd.DataFrame:
    if not DATA_PATH.is_file():
        raise FileNotFoundError(f"Missing experiment data: {DATA_PATH}")
    df = pd.read_csv(DATA_PATH)
    required = {"Name", "Year", "Value", *FEATURES}
    missing = required - set(df.columns)
    if missing:
        raise ValueError(f"experiment_data.csv missing columns: {sorted(missing)}")
    return df.sort_values(["Name", "Year"]).reset_index(drop=True)


def main() -> None:
    experiment_df = _load_experiment()
    experiment_df = experiment_df.copy()
    experiment_df["incidence_change"] = (
        experiment_df["Value"] - experiment_df["previous_incidence"]
    )

    holdout_train = experiment_df[experiment_df["Year"] <= 2020].copy()
    holdout_test = experiment_df[
        (experiment_df["Year"] >= 2021) & (experiment_df["Year"] <= 2025)
    ].copy()

    holdout_model = _build_pipeline()
    holdout_model.fit(
        holdout_train[FEATURES],
        holdout_train["incidence_change"],
    )
    change = holdout_model.predict(holdout_test[FEATURES])
    reconstructed = holdout_test["previous_incidence"].to_numpy() + change
    recomputed = {
        "Previous-Year Baseline": _evaluate(
            holdout_test["Value"].to_numpy(),
            holdout_test["previous_incidence"].to_numpy(),
        ),
        "Model 4: Gradient Boosting": _evaluate(
            holdout_test["Value"].to_numpy(),
            reconstructed,
        ),
        "Average Baseline": _evaluate(
            holdout_test["Value"].to_numpy(),
            np.full(len(holdout_test), holdout_train["Value"].mean()),
        ),
    }

    # Deployment fit: all rows so a current-year request has seen recent history.
    deploy_model = _build_pipeline()
    deploy_model.fit(experiment_df[FEATURES], experiment_df["incidence_change"])

    quartiles = experiment_df["Value"].quantile([0.25, 0.5, 0.75]).to_dict()
    category_cutoffs = {
        "q25": round(float(quartiles[0.25]), 3),
        "q50": round(float(quartiles[0.5]), 3),
        "q75": round(float(quartiles[0.75]), 3),
    }

    ML_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(deploy_model, MODEL_PATH)

    metadata = {
        "model_version": MODEL_VERSION,
        "model_type": "GradientBoostingRegressor",
        "target": "incidence_change",
        "reconstruction": "previous_incidence + predicted_change",
        "prediction_units": "Cases per Thousand",
        "features": FEATURES,
        "feature_units": {
            "temperature": "mean C (previous calendar year, NASA POWER)",
            "rainfall": "total mm (previous calendar year, NASA POWER)",
            "humidity": "mean percent (previous calendar year, NASA POWER)",
            "wind_speed": "mean m/s (previous calendar year, NASA POWER)",
            "previous_incidence": "Cases per Thousand (previous year, MAP)",
            "Name": "Nigerian state / FCT (dataset spelling)",
        },
        "hyperparameters": {
            "n_estimators": 150,
            "learning_rate": 0.03,
            "max_depth": 2,
            "random_state": 42,
        },
        "training_dataset": str(DATA_PATH.relative_to(REPO_ROOT)).replace("\\", "/"),
        "training_rows": int(len(experiment_df)),
        "training_years": {
            "min": int(experiment_df["Year"].min()),
            "max": int(experiment_df["Year"].max()),
        },
        "holdout_split": {
            "train_through": 2020,
            "test_years": [2021, 2022, 2023, 2024, 2025],
        },
        "published_holdout_metrics": PUBLISHED_HOLDOUT,
        "recomputed_holdout_metrics": recomputed,
        "category_cutoffs": category_cutoffs,
        "category_note": (
            "Low / Moderate / Elevated / High are quartiles of training "
            "incidence. They are model bands, not clinical thresholds."
        ),
        "limitations": [
            "State/FCT resolution only — not LGA, neighbourhood, or individual risk.",
            "One climate point per state; annual averages hide seasonal patterns.",
            "No ITN coverage, case management, spraying, or healthcare-access features.",
            (
                "Gradient boosting is the best of the four trained models but still "
                "does not beat the previous-year incidence baseline on 2021–2025."
            ),
            "Prototype for educational / hackathon demonstration — not medical advice.",
        ],
        "sources": [
            {
                "id": "map-trends",
                "title": "Malaria Atlas Project Trends",
                "organisation": "Malaria Atlas Project",
                "url": "https://malariaatlas.org/",
            },
            {
                "id": "nasa-power",
                "title": "NASA POWER meteorological data",
                "organisation": "NASA",
                "url": "https://power.larc.nasa.gov/",
            },
        ],
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "served_model": "Model 4: Gradient Boosting",
    }
    METADATA_PATH.write_text(
        json.dumps(metadata, indent=2) + "\n",
        encoding="utf-8",
    )

    print(f"Wrote {MODEL_PATH}")
    print(f"Wrote {METADATA_PATH}")
    print("Recomputed hold-out (Model 4):", recomputed["Model 4: Gradient Boosting"])
    print("Published hold-out (Model 4):", PUBLISHED_HOLDOUT["Model 4: Gradient Boosting"])
    print("Category cutoffs:", category_cutoffs)
    print("Today (UTC):", date.today().isoformat())


if __name__ == "__main__":
    main()
