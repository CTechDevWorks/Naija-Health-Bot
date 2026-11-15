"""
Sliding-window rate limiting, in-process.

Good enough for a single local/uvicorn instance. When the API runs on more than
one worker or machine, back this with Redis (same interface, shared counters).
"""

from __future__ import annotations

import threading
import time
from collections import defaultdict, deque

from fastapi import HTTPException

from config import settings

from .dependencies import is_anonymous

# Sweep idle callers once the table gets this big, so it cannot grow forever.
_MAX_TRACKED_CALLERS = 10_000

_requests: dict[str, deque[float]] = defaultdict(deque)
_lock = threading.Lock()


def _drop_idle(now: float) -> None:
    longest = max(settings.auth_rate_window_s, settings.anon_rate_window_s)
    for key in [k for k, bucket in _requests.items() if not bucket or bucket[-1] <= now - longest]:
        del _requests[key]


def apply_rate_limit(user_id: str) -> None:
    if is_anonymous(user_id):
        limit, window = settings.anon_rate_limit, settings.anon_rate_window_s
    else:
        limit, window = settings.auth_rate_limit, settings.auth_rate_window_s

    now = time.time()
    with _lock:
        if len(_requests) > _MAX_TRACKED_CALLERS:
            _drop_idle(now)

        bucket = _requests[user_id]
        while bucket and bucket[0] <= now - window:
            bucket.popleft()

        if len(bucket) >= limit:
            retry_after = max(1, int(bucket[0] + window - now))
            raise HTTPException(
                status_code=429,
                detail="You're sending messages too quickly. Please wait a moment and try again.",
                headers={"Retry-After": str(retry_after)},
            )

        bucket.append(now)
