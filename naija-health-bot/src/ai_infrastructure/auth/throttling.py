"""
Sliding-window rate limiting, in-process.

Good enough for a single local/uvicorn instance. When the API runs on more than
one worker or machine, back this with Redis (same interface, shared counters).
"""

from __future__ import annotations

import logging
import threading
import time
from collections import defaultdict, deque

from fastapi import HTTPException, status

from config import settings

from .dependencies import ANONYMOUS_USER

log = logging.getLogger("kadet.throttle")

_requests: dict[str, deque[float]] = defaultdict(deque)
_lock = threading.Lock()


def apply_rate_limit(user_id: str) -> None:
    if user_id == ANONYMOUS_USER:
        limit, window = settings.anon_rate_limit, settings.anon_rate_window_s
    else:
        limit, window = settings.auth_rate_limit, settings.auth_rate_window_s

    now = time.time()
    with _lock:
        bucket = _requests[user_id]
        while bucket and bucket[0] <= now - window:
            bucket.popleft()

        if len(bucket) >= limit:
            retry_after = max(1, int(bucket[0] + window - now))
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="You're sending messages too quickly. Take a breath and try again shortly.",
                headers={"Retry-After": str(retry_after)},
            )

        bucket.append(now)
        log.debug("%s: %d/%d in %ss", user_id, len(bucket), limit, window)
