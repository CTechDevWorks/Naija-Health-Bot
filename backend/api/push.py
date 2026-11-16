"""Register / disable Expo push tokens for health-update alerts."""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException

from schemas import PushTokenRequest, PushTokenResponse
from services import push_store
from services.push_store import PushStoreError

log = logging.getLogger("naija_health.api.push")

router = APIRouter(prefix="/api/v1", tags=["push"])


@router.post("/push-tokens", response_model=PushTokenResponse)
def register_or_update_push_token(body: PushTokenRequest) -> PushTokenResponse:
    """
    enabled=true  → upsert and mark active (user opted in).
    enabled=false → soft-disable so this device stops receiving alerts.
    """
    try:
        if body.enabled:
            push_store.upsert_token(body.token, body.platform)
        else:
            push_store.set_token_enabled(body.token, enabled=False)
    except PushStoreError as err:
        message = str(err)
        if "Invalid Expo" in message:
            raise HTTPException(400, message) from err
        raise HTTPException(503, message) from err
    return PushTokenResponse(ok=True, enabled=body.enabled)
