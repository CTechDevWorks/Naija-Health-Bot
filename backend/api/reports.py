"""Health reports feed + daily scrape/summarise job."""

from __future__ import annotations

import hmac
import logging
import os

from fastapi import APIRouter, Depends, Header, HTTPException, Query

from ai.base import AIPlatform
from config import settings
from schemas import DailyUpdatesJobResponse, HealthReportItem, HealthReportListResponse
from services import reports_pipeline, reports_store
from services.reports_store import ReportsStoreError

from .deps import get_ai_platform

log = logging.getLogger("naija_health.api.reports")

router = APIRouter(prefix="/api/v1", tags=["health-reports"])


def _job_secret() -> str:
    return (os.getenv("UPDATES_JOB_SECRET") or "").strip()


def _require_job_secret(x_job_secret: str | None = Header(default=None, alias="X-Job-Secret")) -> None:
    expected = _job_secret()
    if not expected:
        # Local/dev convenience: allow when secret is unset, but log loudly.
        log.warning("UPDATES_JOB_SECRET is unset — daily job endpoint is open")
        return
    provided = (x_job_secret or "").strip()
    if not provided or not hmac.compare_digest(provided, expected):
        raise HTTPException(401, "Invalid or missing X-Job-Secret header.")


@router.get("/health-reports", response_model=HealthReportListResponse)
def list_health_reports(
    limit: int | None = Query(default=None, ge=1, le=100),
) -> HealthReportListResponse:
    feed_limit = limit if limit is not None else settings.updates_feed_limit
    try:
        rows = reports_store.list_published_reports(limit=feed_limit)
    except ReportsStoreError as err:
        raise HTTPException(503, str(err)) from err

    reports = [HealthReportItem.model_validate(row) for row in rows]
    return HealthReportListResponse(reports=reports, count=len(reports))


@router.post(
    "/jobs/daily-health-updates",
    response_model=DailyUpdatesJobResponse,
    dependencies=[Depends(_require_job_secret)],
)
def run_daily_health_updates(
    platform: AIPlatform = Depends(get_ai_platform),
) -> DailyUpdatesJobResponse:
    result = reports_pipeline.run_daily_updates(
        platform, max_new=settings.updates_feed_limit
    )
    if result.status == "failed":
        # Still return a structured body so Make.com / cron can log it.
        raise HTTPException(
            502,
            detail={
                "status": result.status,
                "triggered_for_date": result.triggered_for_date,
                "job_run_id": result.job_run_id,
                "items_fetched": result.items_fetched,
                "items_inserted": result.items_inserted,
                "items_skipped": result.items_skipped,
                "error_message": result.error_message,
            },
        )
    return DailyUpdatesJobResponse(
        status=result.status,
        triggered_for_date=result.triggered_for_date,
        job_run_id=result.job_run_id,
        items_fetched=result.items_fetched,
        items_inserted=result.items_inserted,
        items_skipped=result.items_skipped,
        error_message=result.error_message,
    )
