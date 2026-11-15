"""The keep-alive timer: it keeps pinging, survives failures, and is off without a public URL."""

import asyncio
import dataclasses

from services import keep_alive


def run_until(calls, count, timeout=10.0, **kwargs):
    """Run the timer until `calls` holds `count` pings. The timeout only stops a hang."""

    async def scenario():
        task = asyncio.create_task(keep_alive.run_keep_alive(**kwargs))
        deadline = asyncio.get_running_loop().time() + timeout
        while len(calls) < count and asyncio.get_running_loop().time() < deadline:
            await asyncio.sleep(0.01)
        task.cancel()

    asyncio.run(scenario())


def test_it_pings_repeatedly(monkeypatch):
    pinged = []
    monkeypatch.setattr(keep_alive, "_ping", pinged.append)

    run_until(pinged, 3, url="https://example.test/api/v1/health", interval_s=0.02)

    assert len(pinged) >= 3
    assert set(pinged) == {"https://example.test/api/v1/health"}


def test_a_failed_ping_does_not_stop_the_timer(monkeypatch):
    attempts = []

    def failing_ping(url):
        attempts.append(url)
        raise OSError("network down")

    monkeypatch.setattr(keep_alive, "_ping", failing_ping)

    run_until(attempts, 3, url="https://example.test/api/v1/health", interval_s=0.02)

    assert len(attempts) >= 3


def test_it_is_off_without_a_public_url(monkeypatch):
    monkeypatch.setattr(keep_alive, "settings", dataclasses.replace(keep_alive.settings, public_url=""))
    assert keep_alive.start_keep_alive() is None


def test_it_is_off_when_the_interval_is_zero(monkeypatch):
    monkeypatch.setattr(
        keep_alive,
        "settings",
        dataclasses.replace(
            keep_alive.settings, public_url="https://example.test", keep_alive_interval_s=0
        ),
    )
    assert keep_alive.start_keep_alive() is None
