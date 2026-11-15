"""GET /api/v1/health — is the service up, and is the AI provider configured?"""

from __future__ import annotations

from fastapi import APIRouter

from config import settings
from schemas import HealthResponse

router = APIRouter(prefix="/api/v1", tags=["service"])


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        provider="bluesminds",
        model=settings.model,
        configured=bool(settings.bluesminds_api_key),
        accounts=settings.accounts_configured,
        rag=settings.rag_configured,
    )
