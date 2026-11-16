"""Prevention API: location mapping, validation, inference, and tip rules."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from main import app
from ml.feature_builder import (
    FeatureBuildError,
    build_features,
    normalize_app_state,
    validate_coordinates,
)
from ml.malaria_model import get_malaria_model, load_malaria_model
from services.prevention_rules import select_tips


@pytest.fixture(scope="module", autouse=True)
def ensure_model_loaded():
    load_malaria_model()
    model = get_malaria_model()
    if not model.ready:
        pytest.skip("Malaria model artefact is not available")


@pytest.fixture
def client():
    return TestClient(app)


def test_normalize_state_aliases():
    assert normalize_app_state("Lagos") == "Lagos"
    assert normalize_app_state("FCT Abuja") == "FCT Abuja"
    assert normalize_app_state("abuja") == "FCT Abuja"
    assert normalize_app_state("Nasarawa") == "Nasarawa"
    assert normalize_app_state("Nassarawa") == "Nasarawa"
    assert normalize_app_state("Atlantis") is None


def test_validate_coordinates_rejects_outside_nigeria():
    validate_coordinates(6.5244, 3.3792)  # Lagos
    with pytest.raises(FeatureBuildError):
        validate_coordinates(51.5, -0.1)  # London
    with pytest.raises(FeatureBuildError):
        validate_coordinates(6.5, 40.0)


def test_build_features_maps_fct_and_nasarawa():
    abuja = build_features("FCT Abuja")
    assert abuja.app_state == "FCT Abuja"
    assert abuja.model_name == "Abuja"
    assert abuja.prediction_year == abuja.feature_year + 1
    assert abuja.previous_incidence > 0

    nasarawa = build_features("Nasarawa")
    assert nasarawa.app_state == "Nasarawa"
    assert nasarawa.model_name == "Nassarawa"
    assert nasarawa.rainfall > 0


def test_stable_prediction_for_fixed_feature_year():
    features = build_features("Lagos", feature_year=2024)
    model = get_malaria_model()
    first = model.predict_incidence(features)
    second = model.predict_incidence(features)
    assert first == pytest.approx(second)
    assert first > 0
    category = model.category_for(first)
    assert category in {"Low", "Moderate", "Elevated", "High"}


def test_prevention_rules_prioritise_wet_elevated():
    features = build_features("Lagos", feature_year=2024)
    wet_features = type(features)(
        **{
            **features.__dict__,
            "rainfall": 2000.0,
        }
    )
    tips = select_tips("High", wet_features)
    assert tips[0].id == "water"
    assert {tip.id for tip in tips} >= {"water", "net", "test"}


def test_prevention_endpoint_ok(client):
    response = client.post(
        "/api/v1/prevention",
        json={
            "latitude": 6.5244,
            "longitude": 3.3792,
            "state": "Lagos",
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["state"] == "Lagos"
    assert body["incidence_per_1000"] > 0
    assert body["category"] in {"Low", "Moderate", "Elevated", "High"}
    assert "Calendar year" in body["period"]
    assert body["model_version"]
    assert len(body["factors"]) >= 4
    assert len(body["tips"]) >= 4
    assert body["disclaimer"]


def test_prevention_endpoint_maps_abuja(client):
    response = client.post(
        "/api/v1/prevention",
        json={
            "latitude": 9.0765,
            "longitude": 7.3986,
            "state": "FCT Abuja",
        },
    )
    assert response.status_code == 200
    assert response.json()["state"] == "FCT Abuja"


def test_prevention_rejects_bad_coordinates(client):
    response = client.post(
        "/api/v1/prevention",
        json={
            "latitude": 51.5,
            "longitude": -0.1,
            "state": "Lagos",
        },
    )
    assert response.status_code == 422
    assert "Nigeria" in response.json()["detail"]


def test_prevention_rejects_unknown_state(client):
    response = client.post(
        "/api/v1/prevention",
        json={
            "latitude": 6.5,
            "longitude": 3.4,
            "state": "Atlantis",
        },
    )
    assert response.status_code == 422


def test_prevention_rejects_missing_fields(client):
    response = client.post("/api/v1/prevention", json={"latitude": 6.5})
    assert response.status_code == 422
