"""
Re-write the top published health reports as 2-paragraph AI write-ups.

From backend/:
    python -m scripts.refresh_feed_writeups
"""

from __future__ import annotations

import logging
import sys
from datetime import datetime, timezone

import httpx

from ai.bluesminds import BluesMinds
from config import settings
from services.reports_scraper import ScrapedArticle, _extract_text, normalise_url, url_hash
from services.reports_store import list_published_reports, require_store
from services.reports_summarizer import summarise_article

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
log = logging.getLogger("naija_health.scripts.refresh_feed")


def _patch_summary(report_id: str, summary: str, model_used: str, key: str) -> None:
    response = httpx.patch(
        f"{settings.supabase_url.rstrip('/')}/rest/v1/health_reports",
        headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
        },
        params={"id": f"eq.{report_id}"},
        json={
            "summary": summary,
            "is_ai_summary": True,
            "model_used": model_used,
        },
        timeout=60.0,
    )
    if response.status_code >= 400:
        raise RuntimeError(f"patch failed ({response.status_code}): {response.text[:300]}")


def main() -> int:
    require_store()
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

    reports = list_published_reports(limit=settings.updates_feed_limit)
    key = settings.supabase_service_role_key
    updated = 0

    with httpx.Client(timeout=60.0, follow_redirects=True) as client:
        for row in reports:
            source = row.get("source") or {}
            link = row["original_url"]
            try:
                page = client.get(link, headers={"User-Agent": "9ja-HealthBot/1.0"})
                page.raise_for_status()
                body = _extract_text(page.text) or row.get("summary") or row["title"]
            except Exception as err:  # noqa: BLE001
                log.warning("fetch failed for %s (%s) — using stored summary", link, err)
                body = row.get("summary") or row["title"]

            published = row.get("published_at") or datetime.now(timezone.utc).isoformat()
            try:
                published_at = datetime.fromisoformat(str(published).replace("Z", "+00:00"))
            except ValueError:
                published_at = datetime.now(timezone.utc)

            article = ScrapedArticle(
                source_slug=source.get("slug") or "unknown",
                source_id=source.get("id") or row["id"],
                source_name=source.get("name") or "Official source",
                title=row["title"],
                original_url=normalise_url(link),
                url_hash=url_hash(link),
                published_at=published_at,
                article_text=body,
            )
            try:
                result = summarise_article(platform, article)
            except Exception as err:  # noqa: BLE001
                log.warning("summarise failed for %s: %s", link, err)
                continue
            if result.skip:
                log.info("skipped %s (%s)", link, result.skip_reason)
                continue
            _patch_summary(row["id"], result.summary, result.model_used, key)
            updated += 1
            log.info("updated %s", row["title"][:70])

    print(f"updated={updated} of {len(reports)}")
    return 0 if updated else 1


if __name__ == "__main__":
    raise SystemExit(main())
