"""Authentication and cloud account synchronization API endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from app.core.security import (
    create_access_token,
    get_authenticated_user,
    hash_password,
    verify_password,
)
from app.db.store import store
from app.models.schemas import (
    AuthLoginRequest,
    AuthRegisterRequest,
    AuthTokenResponse,
    AuthUserProfile,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthTokenResponse)
def register(payload: AuthRegisterRequest) -> AuthTokenResponse:
    """Register a new cloud account and migrate any active guest workspace data."""
    existing = store.get_user_by_email(payload.email)
    if existing:
        raise HTTPException(status_code=409, detail="Email is already registered")

    pwd_hash = hash_password(payload.password)
    user = store.create_user(
        email=payload.email,
        password_hash=pwd_hash,
        display_name=payload.display_name,
    )
    if payload.workspace_id:
        store.migrate_workspace_to_user(payload.workspace_id, user["id"])

    token = create_access_token(user_id=user["id"], email=user["email"])
    return AuthTokenResponse(
        access_token=token,
        user=AuthUserProfile(**user),
    )


@router.post("/login", response_model=AuthTokenResponse)
def login(payload: AuthLoginRequest) -> AuthTokenResponse:
    """Authenticate an existing account and sync workspace state."""
    user = store.get_user_by_email(payload.email)
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if payload.workspace_id:
        store.migrate_workspace_to_user(payload.workspace_id, user["id"])

    token = create_access_token(user_id=user["id"], email=user["email"])
    profile = {
        "id": user["id"],
        "email": user["email"],
        "display_name": user["display_name"],
        "created_at": user["created_at"],
    }
    return AuthTokenResponse(
        access_token=token,
        user=AuthUserProfile(**profile),
    )


@router.get("/me", response_model=AuthUserProfile)
def get_me(claims: Annotated[dict[str, str], Depends(get_authenticated_user)]) -> AuthUserProfile:
    """Return authenticated user profile from database."""
    user = store.get_user_by_id(claims["id"])
    if not user:
        raise HTTPException(status_code=404, detail="User account not found")
    return AuthUserProfile(**user)
