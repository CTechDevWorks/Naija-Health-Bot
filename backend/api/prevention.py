"""POST /api/v1/prevention — trained malaria model report for the Prevention tab."""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException

from schemas import PreventionRequest, PreventionResponse
from services.prevention_service import PreventionError, run_prevention

log = logging.getLogger("naija_health.api.prevention")

router = APIRouter(prefix="/api/v1", tags=["prevention"])


@router.post("/prevention", response_model=PreventionResponse)
def prevention(body: PreventionRequest) -> PreventionResponse:
    try:
        return run_prevention(body)
    except PreventionError as err:
        raise HTTPException(err.status_code, str(err)) from err
    except Exception as err:  # noqa: BLE001 — never leak stack traces
        log.exception("prevention failed: %s", type(err).__name__)
        raise HTTPException(
            503,
            "The Prevention report could not be generated just now. Please try again.",
        ) from err
