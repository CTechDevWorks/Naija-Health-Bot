"""Fetch recent health articles from allowlisted official sources."""

from __future__ import annotations

import hashlib
import logging
import re
from dataclasses import dataclass
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from typing import Any
from urllib.parse import urljoin, urlparse, urlunparse
from xml.etree import ElementTree as ET

import httpx
from bs4 import BeautifulSoup

log = logging.getLogger("naija_health.reports.scraper")

UA = {"User-Agent": "9ja-HealthBot/1.0 (+health updates; contact via app)"}

HEALTH_HINTS = re.compile(
    r"\b("
    r"health|disease|outbreak|epidemic|malaria|cholera|lassa|mpox|monkeypox|"
    r"ebola|covid|vaccine|immuni[sz]ation|fever|virus|infection|surveillance|"
    r"ncdc|who\b|public.?health|ministry of health|medical|hospital|treatment|"
    r"antimicrobial|maternal|polio|measles|dengue|meningitis|tuberculosis|tb\b"
    r")\b",
    re.I,
)

MAX_ARTICLE_CHARS = 12_000
MAX_CANDIDATES_PER_SOURCE = 5


@dataclass(frozen=True)
class ScrapedArticle:
    source_slug: str
    source_id: str
    source_name: str
    title: str
    original_url: str
    url_hash: str
    published_at: datetime
    article_text: str


def normalise_url(url: str) -> str:
    parsed = urlparse(url.strip())
    # Drop fragments and common tracking params; keep path/query that identify the page.
    clean_query = "&".join(
        part
        for part in (parsed.query or "").split("&")
        if part
        and not part.lower().startswith(("utm_", "fbclid=", "gclid="))
    )
    return urlunparse(
        (
            parsed.scheme.lower(),
            parsed.netloc.lower(),
            parsed.path.rstrip("/") or "/",
            "",
            clean_query,
            "",
        )
    )


def url_hash(url: str) -> str:
    return hashlib.sha256(normalise_url(url).encode("utf-8")).hexdigest()


def _parse_date(value: str | None) -> datetime | None:
    if not value:
        return None
    raw = value.strip()
    try:
        return parsedate_to_datetime(raw).astimezone(timezone.utc)
    except (TypeError, ValueError, IndexError):
        pass
    try:
        return datetime.fromisoformat(raw.replace("Z", "+00:00")).astimezone(timezone.utc)
    except ValueError:
        return None


def _looks_health_related(title: str, text: str = "") -> bool:
    blob = f"{title}\n{text[:2000]}"
    return bool(HEALTH_HINTS.search(blob))


def _extract_text(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "nav", "footer", "header", "noscript", "iframe"]):
        tag.decompose()
    main = soup.find("article") or soup.find("main") or soup.body or soup
    text = " ".join(main.get_text(" ", strip=True).split())
    return text[:MAX_ARTICLE_CHARS]


def _get(client: httpx.Client, url: str) -> httpx.Response:
    return client.get(url, headers=UA, follow_redirects=True, timeout=45.0)


def _parse_rss_items(xml_text: str) -> list[dict[str, str]]:
    items: list[dict[str, str]] = []
    try:
        root = ET.fromstring(xml_text)
    except ET.ParseError:
        return items

    # RSS 2.0
    for item in root.findall(".//item"):
        title = (item.findtext("title") or "").strip()
        link = (item.findtext("link") or "").strip()
        pub = (item.findtext("pubDate") or item.findtext("published") or "").strip()
        desc = (item.findtext("description") or "").strip()
        if title and link:
            items.append({"title": title, "link": link, "published": pub, "summary": desc})

    # Atom
    ns = {"a": "http://www.w3.org/2005/Atom"}
    for entry in root.findall(".//a:entry", ns):
        title = (entry.findtext("a:title", default="", namespaces=ns) or "").strip()
        link_el = entry.find("a:link[@rel='alternate']", ns) or entry.find("a:link", ns)
        link = (link_el.get("href") if link_el is not None else "") or ""
        pub = (
            entry.findtext("a:published", default="", namespaces=ns)
            or entry.findtext("a:updated", default="", namespaces=ns)
            or ""
        ).strip()
        summary = (entry.findtext("a:summary", default="", namespaces=ns) or "").strip()
        if title and link:
            items.append({"title": title, "link": link, "published": pub, "summary": summary})
    return items


def scrape_rss_source(
    client: httpx.Client,
    source: dict[str, Any],
    feed_url: str,
) -> list[ScrapedArticle]:
    response = _get(client, feed_url)
    response.raise_for_status()
    items = _parse_rss_items(response.text)
    # Prefer newest when dates parse; otherwise keep document order.
    dated = []
    for item in items:
        published = _parse_date(item.get("published")) or datetime.now(timezone.utc)
        dated.append((published, item))
    dated.sort(key=lambda pair: pair[0], reverse=True)

    out: list[ScrapedArticle] = []
    for published, item in dated[: MAX_CANDIDATES_PER_SOURCE * 2]:
        title = item["title"]
        link = item["link"]
        summary = BeautifulSoup(item.get("summary") or "", "html.parser").get_text(" ", strip=True)
        if not _looks_health_related(title, summary):
            continue
        body = summary
        # Only hit the article page when the feed blurb is too thin to summarise.
        if len(body) < 280:
            try:
                page = _get(client, link)
                page.raise_for_status()
                body = _extract_text(page.text) or summary
            except Exception as err:  # noqa: BLE001 — one bad article should not stop the job
                log.warning("failed to fetch article %s (%s)", link, err)
                body = summary
        if len(body) < 80:
            continue
        out.append(
            ScrapedArticle(
                source_slug=source["slug"],
                source_id=source["id"],
                source_name=source["name"],
                title=title[:300],
                original_url=normalise_url(link),
                url_hash=url_hash(link),
                published_at=published,
                article_text=body,
            )
        )
        if len(out) >= MAX_CANDIDATES_PER_SOURCE:
            break
    return out


def scrape_who_news_listing(client: httpx.Client, source: dict[str, Any]) -> list[ScrapedArticle]:
    listing = "https://www.who.int/news"
    response = _get(client, listing)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")
    seen: set[str] = set()
    candidates: list[tuple[str, str]] = []
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if "/news/item/" not in href:
            continue
        title = " ".join(a.get_text().split())
        if len(title) < 20:
            continue
        url = normalise_url(urljoin(listing, href))
        if url in seen:
            continue
        seen.add(url)
        candidates.append((title, url))
        if len(candidates) >= MAX_CANDIDATES_PER_SOURCE * 2:
            break

    out: list[ScrapedArticle] = []
    for title, link in candidates:
        if not _looks_health_related(title):
            continue
        try:
            page = _get(client, link)
            page.raise_for_status()
            body = _extract_text(page.text)
            # WHO URLs often include YYYY-MM-DD
            m = re.search(r"/(\d{2}-\d{2}-\d{4})-|/(\d{4}-\d{2}-\d{2})-", link)
            published = datetime.now(timezone.utc)
            if m:
                raw = m.group(1) or m.group(2)
                try:
                    if "-" in raw and raw[2] == "-":
                        published = datetime.strptime(raw, "%d-%m-%Y").replace(tzinfo=timezone.utc)
                    else:
                        published = datetime.strptime(raw, "%Y-%m-%d").replace(tzinfo=timezone.utc)
                except ValueError:
                    pass
        except Exception as err:  # noqa: BLE001
            log.warning("WHO article fetch failed %s (%s)", link, err)
            continue
        if len(body) < 80:
            continue
        out.append(
            ScrapedArticle(
                source_slug=source["slug"],
                source_id=source["id"],
                source_name=source["name"],
                title=title[:300],
                original_url=link,
                url_hash=url_hash(link),
                published_at=published,
                article_text=body,
            )
        )
        if len(out) >= MAX_CANDIDATES_PER_SOURCE:
            break
    return out


def scrape_ncdc(client: httpx.Client, source: dict[str, Any]) -> list[ScrapedArticle]:
    pages = [
        "https://ncdc.gov.ng/diseases/sitreps",
        "https://ncdc.gov.ng/reports/weekly",
        "https://ncdc.gov.ng/news/recent",
    ]
    candidates: list[tuple[str, str]] = []
    seen: set[str] = set()
    for page_url in pages:
        try:
            response = _get(client, page_url)
            response.raise_for_status()
        except Exception as err:  # noqa: BLE001
            log.warning("NCDC listing failed %s (%s)", page_url, err)
            continue
        soup = BeautifulSoup(response.text, "html.parser")
        for a in soup.find_all("a", href=True):
            title = " ".join(a.get_text().split())
            href = a["href"]
            if len(title) < 18:
                continue
            if not _looks_health_related(title, href):
                continue
            # Skip pure navigation labels
            if title.lower() in {
                "situation reports",
                "weekly epidemiological reports",
                "guidelines/protocol",
                "project reports",
                "annual reports",
            }:
                continue
            url = normalise_url(urljoin(page_url, href))
            if urlparse(url).netloc and "ncdc.gov.ng" not in urlparse(url).netloc:
                continue
            if url in seen or url.rstrip("/") in {p.rstrip("/") for p in pages}:
                continue
            seen.add(url)
            candidates.append((title, url))
            if len(candidates) >= MAX_CANDIDATES_PER_SOURCE * 2:
                break
        if len(candidates) >= MAX_CANDIDATES_PER_SOURCE * 2:
            break

    out: list[ScrapedArticle] = []
    for title, link in candidates[:MAX_CANDIDATES_PER_SOURCE]:
        try:
            page = _get(client, link)
            page.raise_for_status()
            body = _extract_text(page.text)
        except Exception as err:  # noqa: BLE001
            log.warning("NCDC article fetch failed %s (%s)", link, err)
            body = title
        if len(body) < 40:
            body = f"{title}. Official update published by the Nigeria Centre for Disease Control and Prevention."
        out.append(
            ScrapedArticle(
                source_slug=source["slug"],
                source_id=source["id"],
                source_name=source["name"],
                title=title[:300],
                original_url=link,
                url_hash=url_hash(link),
                published_at=datetime.now(timezone.utc),
                article_text=body[:MAX_ARTICLE_CHARS],
            )
        )
    return out


def scrape_afro_news(client: httpx.Client, source: dict[str, Any]) -> list[ScrapedArticle]:
    listing = "https://www.afro.who.int/news"
    try:
        response = _get(client, listing)
        response.raise_for_status()
    except Exception as err:  # noqa: BLE001
        log.warning("WHO AFRO listing failed (%s)", err)
        return []

    soup = BeautifulSoup(response.text, "html.parser")
    seen: set[str] = set()
    candidates: list[tuple[str, str]] = []
    for a in soup.find_all("a", href=True):
        href = a["href"]
        title = " ".join(a.get_text().split())
        if "/news/" not in href or len(title) < 25:
            continue
        if not _looks_health_related(title):
            continue
        url = normalise_url(urljoin(listing, href))
        if url.rstrip("/") == listing.rstrip("/") or url in seen:
            continue
        seen.add(url)
        candidates.append((title, url))
        if len(candidates) >= MAX_CANDIDATES_PER_SOURCE * 2:
            break

    out: list[ScrapedArticle] = []
    for title, link in candidates:
        try:
            page = _get(client, link)
            page.raise_for_status()
            body = _extract_text(page.text)
        except Exception as err:  # noqa: BLE001
            log.warning("AFRO article fetch failed %s (%s)", link, err)
            continue
        if len(body) < 80:
            continue
        out.append(
            ScrapedArticle(
                source_slug=source["slug"],
                source_id=source["id"],
                source_name=source["name"],
                title=title[:300],
                original_url=link,
                url_hash=url_hash(link),
                published_at=datetime.now(timezone.utc),
                article_text=body,
            )
        )
        if len(out) >= MAX_CANDIDATES_PER_SOURCE:
            break
    return out


def collect_articles(sources: list[dict[str, Any]]) -> list[ScrapedArticle]:
    collected: list[ScrapedArticle] = []
    with httpx.Client(timeout=60.0) as client:
        for source in sources:
            slug = source.get("slug") or ""
            try:
                if slug == "who":
                    feeds = [
                        source.get("feed_url")
                        or "https://www.who.int/rss-feeds/news-english.xml",
                    ]
                    articles = []
                    for feed in feeds:
                        if not feed:
                            continue
                        try:
                            articles.extend(scrape_rss_source(client, source, feed))
                        except Exception as err:  # noqa: BLE001
                            log.warning("WHO feed failed %s (%s)", feed, err)
                    # Dedupe within WHO before optional HTML fallback
                    by_hash = {a.url_hash: a for a in articles}
                    articles = list(by_hash.values())
                    if len(articles) < 2:
                        articles = scrape_who_news_listing(client, source)
                elif slug == "who-afro":
                    articles = scrape_afro_news(client, source)
                elif slug == "ncdc":
                    articles = scrape_ncdc(client, source)
                elif source.get("feed_url"):
                    articles = scrape_rss_source(client, source, source["feed_url"])
                else:
                    log.info("no scraper configured for source %s — skipped", slug)
                    articles = []
                log.info("source %s collected %s articles", slug, len(articles))
                collected.extend(articles)
            except Exception as err:  # noqa: BLE001
                log.exception("source %s scrape failed: %s", slug, err)
    # Dedupe within this run
    by_hash: dict[str, ScrapedArticle] = {}
    for article in collected:
        by_hash.setdefault(article.url_hash, article)
    return list(by_hash.values())
