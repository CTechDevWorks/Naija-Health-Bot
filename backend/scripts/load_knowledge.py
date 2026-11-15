"""
Load `knowledge_base/RAGInfo/documents/` into Supabase for RAG.

What it does:
  1. Reads every topic file and splits it into sections.
  2. Skips any section marked `Source: PENDING`, and any source id that is not
     in `knowledge_base/sources.json` or that has no URL.
  3. Upserts documents and sections. When a section's text changes, its
     embedding is cleared so it is re-embedded.
  4. Calls the `rag-embed` edge function for every section that still has no
     embedding (covers the case where the database trigger could not run).

Run from the backend folder, after the SQL in `supabase/rag.sql` and the
edge functions are in place, with these filled in in `.env`:

    SUPABASE_URL=
    SUPABASE_SERVICE_ROLE_KEY=

    python -m scripts.load_knowledge
    python -m scripts.load_knowledge --dry-run
"""

from __future__ import annotations

import argparse
import logging
import sys
import time
from pathlib import Path

import httpx

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from config import settings  # noqa: E402
from knowledge import DocumentError, Section, load_documents  # noqa: E402
from services.sources import load_sources  # noqa: E402

log = logging.getLogger("naija_health.load_knowledge")

DOCUMENTS_DIR = settings.rag_documents_dir
EMBED_BATCH = 8


def usable(section: Section) -> bool:
    if section.pending:
        return False
    approved = load_sources()
    if not section.source_ids:
        return False
    for sid in section.source_ids:
        source = approved.get(sid)
        if source is None or not source.url:
            return False
    return True


def _request_with_retries(
    method: str,
    url: str,
    *,
    headers: dict,
    json=None,
    params=None,
    timeout: float,
    attempts: int = 5,
) -> httpx.Response:
    last: Exception | None = None
    for attempt in range(1, attempts + 1):
        try:
            return httpx.request(
                method,
                url,
                headers=headers,
                json=json,
                params=params,
                timeout=timeout,
            )
        except (httpx.ConnectTimeout, httpx.ReadTimeout, httpx.ConnectError) as exc:
            last = exc
            wait = min(2 ** attempt, 20)
            log.warning(
                "%s %s failed (%s); retry %s/%s in %ss",
                method,
                url.split("/rest/")[-1].split("/functions/")[-1],
                type(exc).__name__,
                attempt,
                attempts,
                wait,
            )
            time.sleep(wait)
    assert last is not None
    raise last


def rest(path: str, method: str, key: str, *, json=None, params=None) -> httpx.Response:
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=minimal",
    }
    return _request_with_retries(
        method,
        f"{settings.supabase_url.rstrip('/')}/rest/v1/{path}",
        headers=headers,
        json=json,
        params=params,
        timeout=60.0,
    )


def embed_missing(ids: list[str], key: str) -> int:
    if not ids:
        return 0
    updated = 0
    url = f"{settings.supabase_url.rstrip('/')}/functions/v1/rag-embed"
    for start in range(0, len(ids), EMBED_BATCH):
        chunk = ids[start : start + EMBED_BATCH]
        response = _request_with_retries(
            "POST",
            url,
            headers={
                "Authorization": f"Bearer {key}",
                "apikey": key,
                "Content-Type": "application/json",
            },
            json={"ids": chunk},
            timeout=300.0,
        )
        if response.status_code >= 400:
            raise RuntimeError(
                f"rag-embed failed for {len(chunk)} ids ({response.status_code})"
            )
        updated += int(response.json().get("updated", 0))
    return updated


def load(*, dry_run: bool) -> int:
    all_sections = load_documents(DOCUMENTS_DIR)
    sections = [s for s in all_sections if usable(s)]
    skipped = len(all_sections) - len(sections)
    log.info("loading %s sections (skipped %s pending or unusable)", len(sections), skipped)

    if dry_run:
        for section in sections[:10]:
            log.info("would load %s (%s)", section.key, ",".join(section.source_ids))
        if len(sections) > 10:
            log.info("… and %s more", len(sections) - 10)
        return 0

    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise SystemExit(
            "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env first."
        )

    key = settings.supabase_service_role_key
    documents: dict[str, Section] = {}
    for section in sections:
        documents.setdefault(section.document, section)

    docs_payload = [
        {
            "id": section.document,
            "title": section.title,
            "topic": section.topic,
            "region": section.region,
            "status": section.status,
        }
        for section in documents.values()
    ]
    response = rest(
        "kb_documents",
        "POST",
        key,
        json=docs_payload,
        params={"on_conflict": "id"},
    )
    if response.status_code >= 400:
        raise RuntimeError(f"kb_documents upsert failed ({response.status_code})")

    # Existing hashes so we only clear embeddings when the text changed.
    existing: dict[str, str] = {}
    listed = rest(
        "kb_sections",
        "GET",
        key,
        params={"select": "id,content_hash", "limit": "10000"},
    )
    if listed.status_code < 400:
        for row in listed.json():
            existing[row["id"]] = row["content_hash"]

    to_embed: list[str] = []
    for section in sections:
        changed = existing.get(section.key) != section.content_hash
        row = {
            "id": section.key,
            "document_id": section.document,
            "heading": section.heading,
            "content": section.content,
            "source_ids": list(section.source_ids),
            "content_hash": section.content_hash,
        }
        if changed:
            # Clear the embedding so rag-embed / the trigger rewrite it.
            row["embedding"] = None
            to_embed.append(section.key)
        response = rest(
            "kb_sections",
            "POST",
            key,
            json=row,
            params={"on_conflict": "id"},
        )
        # Prefer header already asks for merge-duplicates; some projects want
        # an explicit upsert query flag.
        if response.status_code >= 400:
            # Fallback: PATCH the row.
            patch = rest(
                "kb_sections",
                "PATCH",
                key,
                json={k: v for k, v in row.items() if k != "id"},
                params={"id": f"eq.{section.key}"},
            )
            if patch.status_code >= 400:
                raise RuntimeError(
                    f"kb_sections upsert failed for {section.key} "
                    f"({response.status_code}/{patch.status_code})"
                )
        if section.key not in existing:
            to_embed.append(section.key)

    # Unique, keep order.
    to_embed = list(dict.fromkeys(to_embed))
    # Also pick up any rows that somehow still have a null embedding.
    missing = rest(
        "kb_sections",
        "GET",
        key,
        params={"select": "id", "embedding": "is.null", "limit": "10000"},
    )
    if missing.status_code < 400:
        for row in missing.json():
            if row["id"] not in to_embed:
                to_embed.append(row["id"])

    embedded = embed_missing(to_embed, key)
    log.info(
        "done: %s documents, %s sections loaded, %s embeddings written",
        len(documents),
        len(sections),
        embedded,
    )
    return 0


def main() -> int:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Parse and list sections without writing to Supabase.",
    )
    args = parser.parse_args()
    try:
        return load(dry_run=args.dry_run)
    except DocumentError as err:
        log.error("%s", err)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
