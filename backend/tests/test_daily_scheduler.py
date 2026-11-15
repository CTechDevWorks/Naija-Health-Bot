"""Daily 07:00 Africa/Lagos scheduler helpers."""

from datetime import datetime

from services.daily_scheduler import LAGOS, seconds_until_next_run, start_daily_scheduler
from config import settings
import dataclasses


def test_seconds_until_next_run_before_seven():
    now = datetime(2026, 11, 15, 6, 30, tzinfo=LAGOS)
    delay = seconds_until_next_run(now)
    assert 29 * 60 <= delay <= 31 * 60


def test_seconds_until_next_run_after_seven_rolls_to_tomorrow():
    now = datetime(2026, 11, 15, 7, 0, 1, tzinfo=LAGOS)
    delay = seconds_until_next_run(now)
    # Almost 24 hours
    assert 23 * 3600 < delay <= 24 * 3600


def test_scheduler_off_locally_by_default(monkeypatch):
    monkeypatch.setattr(
        "services.daily_scheduler.settings",
        dataclasses.replace(settings, public_url="", updates_scheduler_enabled=""),
    )
    assert start_daily_scheduler() is None


def test_scheduler_forced_on(monkeypatch):
    import asyncio

    monkeypatch.setattr(
        "services.daily_scheduler.settings",
        dataclasses.replace(settings, public_url="", updates_scheduler_enabled="1"),
    )

    async def noop():
        return None

    monkeypatch.setattr("services.daily_scheduler.run_daily_scheduler", noop)

    async def _check() -> None:
        task = start_daily_scheduler()
        assert task is not None
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass

    asyncio.run(_check())
