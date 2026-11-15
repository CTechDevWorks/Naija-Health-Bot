"""Daily health-updates pipeline: scrape → summarise → Supabase."""

from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone

from ai.base import AIPlatform
from config import settings
from services import reports_store
from services.reports_scraper import ScrapedArticle, collect_articles
from services.reports_summarizer import summarise_article

log = logging.getLogger("naija_health.reports.pipeline")

# Africa/Lagos is UTC+1 year-round (no DST). Avoid zoneinfo/tzdata on Windows.
LAGOS = timezone(timedelta(hours=1), name="Africa/Lagos")

_SOURCE_RANK = {
    "ncdc": 0,
    "fmohsw": 1,
    "nphcda": 2,
    "nmep": 3,
    "who-afro": 4,
    "who": 5,
}


def _prefer_nigeria_first(articles: list[ScrapedArticle]) -> list[ScrapedArticle]:
    return sorted(
        articles,
        key=lambda a: (
            _SOURCE_RANK.get(a.source_slug, 50),
            -a.published_at.timestamp(),
        ),
    )


@dataclass(frozen=True)
class PipelineResult:
    status: str
    triggered_for_date: str
    job_run_id: str | None
    items_fetched: int
    items_inserted: int
    items_skipped: int
    error_message: str | None = None


def _lagos_today() -> date:
    return datetime.now(LAGOS).date()


def run_daily_updates(
    platform: AIPlatform,
    *,
    max_new: int | None = None,
) -> PipelineResult:
    """Scrape allowlisted sources, summarise new items, insert into Supabase."""
    limit = max_new if max_new is not None else settings.updates_feed_limit
    day = _lagos_today().isoformat()
    job_id: str | None = None
    fetched = 0
    inserted = 0
    skipped = 0

    try:
        reports_store.require_store()
        job = reports_store.create_job_run(day)
        job_id = str(job["id"])

        sources = reports_store.list_active_sources()
        sources = sorted(sources, key=lambda s: int(s.get("priority") or 999))
        articles = collect_articles(sources)
        fetched = len(articles)

        known = reports_store.existing_url_hashes([a.url_hash for a in articles])
        fresh = _prefer_nigeria_first([a for a in articles if a.url_hash not in known])
        duplicates = len(articles) - len(fresh)
        fresh = fresh[: max(1, limit)]
        truncated = max(0, (fetched - duplicates) - len(fresh))

        for article in fresh:
            try:
                summary = summarise_article(platform, article)
            except Exception as err:  # noqa: BLE001
                log.warning("summarise failed for %s: %s", article.original_url, err)
                skipped += 1
                continue

            if summary.skip:
                log.info("skipped %s (%s)", article.original_url, summary.skip_reason)
                skipped += 1
                continue

            row = {
                "source_id": article.source_id,
                "title": summary.title,
                "summary": summary.summary,
                "original_url": article.original_url,
                "url_hash": article.url_hash,
                "published_at": article.published_at.isoformat(),
                "topic": summary.topic,
                "location_scope": summary.location_scope,
                "urgency": summary.urgency,
                "is_ai_summary": True,
                "raw_excerpt": summary.raw_excerpt,
                "model_used": summary.model_used,
                "job_run_id": job_id,
                "is_published": True,
            }
            saved = reports_store.insert_report(row)
            if saved is None:
                skipped += 1
            else:
                inserted += 1

        skipped += duplicates + truncated
        status = "success"
        if fetched > 0 and inserted == 0 and duplicates < fetched:
            status = "partial"

        reports_store.finish_job_run(
            job_id,
            status=status,
            items_fetched=fetched,
            items_inserted=inserted,
            items_skipped=skipped,
        )
        return PipelineResult(
            status=status,
            triggered_for_date=day,
            job_run_id=job_id,
            items_fetched=fetched,
            items_inserted=inserted,
            items_skipped=skipped,
        )
    except Exception as err:  # noqa: BLE001
        log.exception("daily updates pipeline failed")
        if job_id:
            try:
                reports_store.finish_job_run(
                    job_id,
                    status="failed",
                    items_fetched=fetched,
                    items_inserted=inserted,
                    items_skipped=skipped,
                    error_message=str(err)[:2000],
                )
            except Exception:  # noqa: BLE001
                log.exception("could not mark job run failed")
        return PipelineResult(
            status="failed",
            triggered_for_date=day,
            job_run_id=job_id,
            items_fetched=fetched,
            items_inserted=inserted,
            items_skipped=skipped,
            error_message=str(err)[:2000],
        )
