"""
Run the health-updates pipeline every day at 07:00 Africa/Lagos.

This timer lives inside the FastAPI process (same idea as keep-alive). On Render
it only fires while the service is awake — keep-alive helps with that. For a
hard guarantee, also point Make.com / GitHub Actions at
POST /api/v1/jobs/daily-health-updates at 06:00 UTC.
"""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timedelta, timezone

from config import settings

log = logging.getLogger("naija_health.reports.scheduler")

LAGOS = timezone(timedelta(hours=1), name="Africa/Lagos")
TARGET_HOUR = 7
TARGET_MINUTE = 0


def seconds_until_next_run(now: datetime | None = None) -> float:
    """Seconds until the next 07:00 Africa/Lagos (never returns 0)."""
    current = (now or datetime.now(LAGOS)).astimezone(LAGOS)
    target = current.replace(hour=TARGET_HOUR, minute=TARGET_MINUTE, second=0, microsecond=0)
    if current >= target:
        target = target + timedelta(days=1)
    return max((target - current).total_seconds(), 1.0)


def _run_pipeline() -> None:
    from ai.bluesminds import BluesMinds
    from services.reports_pipeline import run_daily_updates

    if not settings.bluesminds_api_key:
        raise RuntimeError("BLUESMINDS_API_KEY is not set.")
    platform = BluesMinds(
        api_key=settings.bluesminds_api_key,
        base_url=settings.bluesminds_base_url,
        model=settings.model,
        fallback_models=settings.fallback_models,
        temperature=settings.temperature,
        max_output_tokens=settings.max_output_tokens,
        timeout_s=settings.request_timeout_s,
    )
    result = run_daily_updates(platform, max_new=5)
    log.info(
        "scheduled daily updates finished status=%s inserted=%s fetched=%s",
        result.status,
        result.items_inserted,
        result.items_fetched,
    )
    if result.error_message:
        log.warning("scheduled daily updates error: %s", result.error_message)


async def run_daily_scheduler() -> None:
    """Sleep until 07:00 Lagos, run the job, repeat until cancelled."""
    while True:
        delay = seconds_until_next_run()
        next_at = datetime.now(LAGOS) + timedelta(seconds=delay)
        log.info(
            "daily updates scheduler armed — next run %s (in %.0fs)",
            next_at.isoformat(),
            delay,
        )
        await asyncio.sleep(delay)
        try:
            await asyncio.to_thread(_run_pipeline)
        except Exception:  # noqa: BLE001 — never kill the loop on one bad day
            log.exception("scheduled daily updates failed")


def start_daily_scheduler() -> asyncio.Task[None] | None:
    """
    Start the 07:00 Lagos timer when enabled.

    On by default when RENDER_EXTERNAL_URL is set (deployed). Override with
    UPDATES_SCHEDULER_ENABLED=1/0.
    """
    raw = (settings.updates_scheduler_enabled or "").strip().lower()
    if raw in {"0", "false", "no", "off"}:
        return None
    if raw in {"1", "true", "yes", "on"}:
        enabled = True
    else:
        # Auto-enable in deployed environments that already have a public URL.
        enabled = bool(settings.public_url)

    if not enabled:
        return None
    log.info("daily updates scheduler on: 07:00 Africa/Lagos")
    return asyncio.create_task(run_daily_scheduler())
