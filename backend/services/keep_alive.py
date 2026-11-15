"""
Keep a free Render instance from going to sleep.

Render's free web services stop after about 15 minutes with no incoming
requests, and the next visitor then waits for a cold start. While the service
is up, this calls its own public health endpoint on a timer so there is always
recent traffic.

- The ping hits GET /api/v1/health, which never calls the AI provider.
- It only runs where a public URL is known (Render sets RENDER_EXTERNAL_URL),
  so it is off during local development.
- It cannot wake a service that is already stopped (after a deploy, a crash or
  a platform restart). The first real request does that; the timer then resumes.
"""

from __future__ import annotations

import asyncio
import logging
import urllib.request

from config import settings

log = logging.getLogger("naija_health.keep_alive")

_PING_TIMEOUT_S = 30


def _ping(url: str) -> None:
    with urllib.request.urlopen(url, timeout=_PING_TIMEOUT_S) as response:
        response.read()


async def run_keep_alive(url: str, interval_s: float) -> None:
    """Ping `url` every `interval_s` seconds until cancelled."""
    while True:
        await asyncio.sleep(interval_s)
        try:
            # urllib blocks, so it runs in a worker thread.
            await asyncio.to_thread(_ping, url)
        except Exception as err:  # noqa: BLE001 — one failed ping must not stop the timer
            log.warning("keep-alive ping failed: %s", type(err).__name__)


def start_keep_alive() -> asyncio.Task[None] | None:
    """Start the timer if this deployment has a public URL; otherwise do nothing."""
    if not settings.public_url or settings.keep_alive_interval_s <= 0:
        return None
    url = f"{settings.public_url}/api/v1/health"
    log.info("keep-alive on: pinging %s every %ss", url, settings.keep_alive_interval_s)
    return asyncio.create_task(run_keep_alive(url, settings.keep_alive_interval_s))
