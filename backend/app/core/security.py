"""Authentication, JWT token lifecycle, and owner isolation helpers."""

import hashlib
import hmac
import logging
import os
import re
import secrets
from datetime import UTC, datetime, timedelta
from typing import Annotated

from fastapi import Header, HTTPException
from jose import JWTError, jwt

from app.core.config import settings

logger = logging.getLogger(__name__)

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days
_EPHEMERAL_DEV_SECRET: str | None = None
_WORKSPACE_ID_PATTERN = re.compile(r"^[a-zA-Z0-9_-]{3,64}$")


def _get_jwt_secret() -> str:
    global _EPHEMERAL_DEV_SECRET
    if settings.jwt_secret_key:
        return settings.jwt_secret_key
    if _EPHEMERAL_DEV_SECRET is None:
        _EPHEMERAL_DEV_SECRET = secrets.token_urlsafe(32)
        logger.warning(
            "JWT_SECRET_KEY not configured; using ephemeral runtime signing key. "
            "Set JWT_SECRET_KEY in environment for persistent multi-instance sessions."
        )
    return _EPHEMERAL_DEV_SECRET


def hash_password(password: str) -> str:
    """Hash a password with PBKDF2-HMAC-SHA256 and a random 16-byte salt."""
    salt = os.urandom(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 120_000)
    return f"{salt.hex()}:{digest.hex()}"


def verify_password(password: str, stored_hash: str) -> bool:
    """Constant-time verification of a password against stored salt:digest."""
    try:
        salt_hex, digest_hex = stored_hash.split(":", 1)
        salt = bytes.fromhex(salt_hex)
        expected = bytes.fromhex(digest_hex)
        candidate = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 120_000)
        return hmac.compare_digest(candidate, expected)
    except Exception:
        return False


def create_access_token(user_id: str, email: str) -> str:
    """Create a signed JWT access token scoped to user_id."""
    now = datetime.now(UTC)
    payload = {
        "sub": user_id,
        "email": email,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)).timestamp()),
    }
    return jwt.encode(payload, _get_jwt_secret(), algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict[str, str] | None:
    """Validate and decode a Bearer JWT access token."""
    try:
        payload = jwt.decode(token, _get_jwt_secret(), algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        email = payload.get("email", "")
        if not isinstance(user_id, str) or not user_id:
            return None
        return {"id": user_id, "email": str(email)}
    except JWTError:
        return None


def resolve_owner_id(
    authorization: str | None = None,
    x_workspace_id: str | None = None,
) -> str:
    """Resolve authoritative owner scope from verified JWT or sanitized workspace ID."""
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization[7:].strip()
        claims = decode_access_token(token)
        if not claims:
            raise HTTPException(status_code=401, detail="Invalid or expired access token")
        return f"user:{claims['id']}"

    if x_workspace_id and _WORKSPACE_ID_PATTERN.match(x_workspace_id.strip()):
        return f"ws:{x_workspace_id.strip()}"

    return "ws:default"


def get_owner_id(
    authorization: Annotated[str | None, Header()] = None,
    x_workspace_id: Annotated[str | None, Header(alias="X-Workspace-ID")] = None,
) -> str:
    """FastAPI dependency returning verified owner scope (`user:<id>` or `ws:<id>`)."""
    return resolve_owner_id(authorization=authorization, x_workspace_id=x_workspace_id)


def get_authenticated_user(
    authorization: Annotated[str | None, Header()] = None,
) -> dict[str, str]:
    """FastAPI dependency requiring a valid Bearer JWT."""
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing authentication token")
    token = authorization[7:].strip()
    claims = decode_access_token(token)
    if not claims:
        raise HTTPException(status_code=401, detail="Invalid or expired access token")
    return claims
