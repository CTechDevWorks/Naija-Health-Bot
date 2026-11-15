"""
Run the daily health-updates pipeline once.

From backend/:
    python -m scripts.run_daily_updates
"""

from __future__ import annotations

import logging
import sys

from ai.bluesminds import BluesMinds
from config import settings
from services.reports_pipeline import run_daily_updates

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")


def main() -> int:
    if not settings.bluesminds_api_key:
        print("BLUESMINDS_API_KEY is not set.", file=sys.stderr)
        return 1
    platform = BluesMinds(
        api_key=settings.bluesminds_api_key,
        base_url=settings.bluesminds_base_url,
        model=settings.model,
        fallback_models=settings.fallback_models,
        temperature=settings.temperature,
        max_output_tokens=settings.max_output_tokens,
        timeout_s=settings.request_timeout_s,
    )
    result = run_daily_updates(platform)
    print(
        f"status={result.status} date={result.triggered_for_date} "
        f"fetched={result.items_fetched} inserted={result.items_inserted} "
        f"skipped={result.items_skipped} job={result.job_run_id}"
    )
    if result.error_message:
        print(f"error={result.error_message}", file=sys.stderr)
    return 0 if result.status != "failed" else 1


if __name__ == "__main__":
    raise SystemExit(main())
