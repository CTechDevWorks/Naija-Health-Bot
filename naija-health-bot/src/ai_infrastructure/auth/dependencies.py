"""
Identify the caller from the Supabase access token the browser already holds.

- No token          → anonymous identity (stricter rate limit).
- Valid token       → the Supabase user id (`sub`).
- Invalid / expired → 401.

Verification supports both Supabase signing modes:
  * ES256 (current default) — public keys fetched from the project's JWKS URL.
  * HS256 (legacy projects) — set SUPABASE_JWT_SECRET.
"""

from __future__ import annotations

import logging
from functools import lru_cache
from typing import Optional

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWKClient

from config import settings

log = logging.getLogger("kadet.auth")

ANONYMOUS_USER = "anonymous"
bearer = HTTPBearer(auto_error=False)

_credentials_exception = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)


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
    creds: Optional[HTTPAuthorizationCredentials] = Depends(bearer),
) -> str:
    if creds is None or not creds.credentials:
        return ANONYMOUS_USER

    try:
        payload = _decode(creds.credentials)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Session expired — please log in again.")
    except jwt.PyJWTError as err:
        log.info("rejected token: %s", err)
        raise _credentials_exception from err

    sub = payload.get("sub")
    if not isinstance(sub, str) or not sub:
        raise _credentials_exception
    return sub
