"""
Identify the caller.

9ja Health needs no account, so most requests carry no token:

- No token          → anonymous identity, keyed by client IP for rate limiting.
- Valid token       → the Supabase user id (`sub`).
- Invalid / expired → 401.

Token verification is only active once SUPABASE_URL (or SUPABASE_JWT_SECRET) is
configured. It supports both Supabase signing modes:
  * ES256 (current default) — public keys fetched from the project's JWKS URL.
  * HS256 (legacy projects) — set SUPABASE_JWT_SECRET.
"""

from __future__ import annotations

import logging
from functools import lru_cache
from typing import Optional

import jwt
from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWKClient

from config import settings

log = logging.getLogger("naija_health.auth")

ANONYMOUS_PREFIX = "anon:"
bearer = HTTPBearer(auto_error=False)

_credentials_exception = HTTPException(
    status_code=401,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)


def is_anonymous(user_id: str) -> bool:
    return user_id.startswith(ANONYMOUS_PREFIX)


@lru_cache(maxsize=1)
def _jwks_client() -> PyJWKClient | None:
    if not settings.supabase_url:
        return None
    url = f"{settings.supabase_url}/auth/v1/.well-known/jwks.json"
    return PyJWKClient(url, cache_keys=True, lifespan=3600)


def _decode(token: str) -> dict:
    options = {"verify_aud": False}  # Supabase sets aud="authenticated"; we key off `sub`.
    header = jwt.get_unverified_header(token)
    alg = header.get("alg", "")

    if alg.startswith("HS"):
        if not settings.supabase_jwt_secret:
            raise jwt.InvalidTokenError("HS256 token but SUPABASE_JWT_SECRET is not configured")
        return jwt.decode(token, settings.supabase_jwt_secret, algorithms=[alg], options=options)

    client = _jwks_client()
    if client is None:
        raise jwt.InvalidTokenError("SUPABASE_URL is not configured")
    signing_key = client.get_signing_key_from_jwt(token)
    return jwt.decode(token, signing_key.key, algorithms=[alg], options=options)


async def get_user_identifier(
    request: Request,
    creds: Optional[HTTPAuthorizationCredentials] = Depends(bearer),
) -> str:
    if creds is None or not creds.credentials:
        # Behind a reverse proxy this is the proxy's address unless uvicorn is
        # started with --proxy-headers and a trusted --forwarded-allow-ips.
        host = request.client.host if request.client else "unknown"
        return f"{ANONYMOUS_PREFIX}{host}"

    try:
        payload = _decode(creds.credentials)
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Session expired — please log in again.")
    except jwt.PyJWTError as err:
        log.info("rejected token: %s", err)
        raise _credentials_exception from err

    sub = payload.get("sub")
    if not isinstance(sub, str) or not sub:
        raise _credentials_exception
    return sub
