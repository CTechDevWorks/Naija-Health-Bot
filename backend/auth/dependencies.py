"""
Identify the caller.

Sign-in is optional in 9ja Health, so most requests carry no token:

- No token          → guest, keyed by client IP for rate limiting.
- Valid token       → the Supabase user id (`sub`) and how they signed in (`aal`).
- Invalid / expired → 401.

Accounts must use two-factor sign-in. Supabase records that in the token:
`aal1` means password only, `aal2` means password plus an authenticator code.
A caller counts as a verified account only at `aal2`. A valid `aal1` token is
treated like a guest for the chat and is refused by anything that touches saved
history (see `require_account`).

Token verification is only active once SUPABASE_URL (or SUPABASE_JWT_SECRET) is
configured. It supports both Supabase signing modes:
  * ES256 / RS256 (current default) — public keys from the project's JWKS URL.
  * HS256 (legacy projects) — set SUPABASE_JWT_SECRET.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from functools import lru_cache
from typing import Optional

import jwt
from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWKClient

from config import settings

log = logging.getLogger("naija_health.auth")

ANONYMOUS_PREFIX = "anon:"
AAL_TWO_FACTOR = "aal2"

_ASYMMETRIC_ALGORITHMS = ("ES256", "RS256")
_SHARED_SECRET_ALGORITHMS = ("HS256",)

bearer = HTTPBearer(auto_error=False)

_credentials_exception = HTTPException(
    status_code=401,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)


@dataclass(frozen=True)
class Identity:
    """Who is calling, as far as the server has verified."""

    # Rate-limit key: the user id, or "anon:<ip>" for guests.
    key: str
    user_id: str | None = None
    # "aal1" (password only) or "aal2" (password + authenticator code).
    aal: str | None = None
    # The caller's own access token, passed on to Supabase so that row-level
    # security decides what they can read and write.
    token: str | None = None

    @property
    def signed_in(self) -> bool:
        return self.user_id is not None

    @property
    def verified(self) -> bool:
        """Signed in and passed the second factor."""
        return self.signed_in and self.aal == AAL_TWO_FACTOR


def is_anonymous(user_id: str) -> bool:
    return user_id.startswith(ANONYMOUS_PREFIX)


@lru_cache(maxsize=1)
def _jwks_client() -> PyJWKClient | None:
    if not settings.supabase_url:
        return None
    url = f"{settings.supabase_url}/auth/v1/.well-known/jwks.json"
    return PyJWKClient(url, cache_keys=True, lifespan=3600)


def _decode(token: str) -> dict:
    # Supabase user tokens carry aud="authenticated". When the project URL is
    # known, the issuer must be that project's auth server.
    checks: dict = {"audience": "authenticated"}
    if settings.supabase_url:
        checks["issuer"] = f"{settings.supabase_url}/auth/v1"

    alg = jwt.get_unverified_header(token).get("alg", "")

    if alg in _SHARED_SECRET_ALGORITHMS:
        if not settings.supabase_jwt_secret:
            raise jwt.InvalidTokenError("HS256 token but SUPABASE_JWT_SECRET is not configured")
        return jwt.decode(token, settings.supabase_jwt_secret, algorithms=[alg], **checks)

    if alg not in _ASYMMETRIC_ALGORITHMS:
        raise jwt.InvalidTokenError(f"unsupported signing algorithm: {alg or 'none'}")

    client = _jwks_client()
    if client is None:
        raise jwt.InvalidTokenError("SUPABASE_URL is not configured")
    signing_key = client.get_signing_key_from_jwt(token)
    return jwt.decode(token, signing_key.key, algorithms=[alg], **checks)


async def get_identity(
    request: Request,
    creds: Optional[HTTPAuthorizationCredentials] = Depends(bearer),
) -> Identity:
    if creds is None or not creds.credentials:
        # Behind a reverse proxy this is the proxy's address unless uvicorn is
        # started with --proxy-headers and a trusted --forwarded-allow-ips.
        host = request.client.host if request.client else "unknown"
        return Identity(key=f"{ANONYMOUS_PREFIX}{host}")

    try:
        payload = _decode(creds.credentials)
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Your session has expired. Please sign in again.")
    except jwt.PyJWTError as err:
        log.info("rejected token: %s", err)
        raise _credentials_exception from err

    sub = payload.get("sub")
    if not isinstance(sub, str) or not sub:
        raise _credentials_exception

    aal = payload.get("aal")
    return Identity(
        key=sub,
        user_id=sub,
        aal=aal if isinstance(aal, str) else None,
        token=creds.credentials,
    )


def require_account(identity: Identity = Depends(get_identity)) -> Identity:
    """For anything that belongs to an account: signed in, with the second factor."""
    if not identity.signed_in:
        raise HTTPException(
            status_code=401,
            detail="Please sign in to use saved conversations.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not identity.verified:
        raise HTTPException(
            status_code=403,
            detail="Finish two-factor sign-in to use saved conversations.",
        )
    return identity
