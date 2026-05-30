from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import create_access_token, get_current_user
from app.config import Settings, get_settings
from app.dependencies import get_postgres_repository
from app.repositories.postgres import PostgresRepository, UserRecord
from app.schemas import AuthLoginRequest, AuthSessionResponse, AuthUserResponse
from app.services.supabase_auth import (
    SupabaseAuthenticationError,
    authenticate_user,
)

router = APIRouter(tags=["auth"])


def _serialize_user(user: UserRecord) -> AuthUserResponse:
    return AuthUserResponse(
        id=user.id,
        email=user.email,
        role=user.role,
        plan=user.plan,
        access_status=user.access_status,
        access_expires_at=user.access_expires_at,
        daily_usage_limit=user.daily_usage_limit,
    )


@router.post("/auth/login", response_model=AuthSessionResponse)
def login(
    payload: AuthLoginRequest,
    settings: Settings = Depends(get_settings),
    repository: PostgresRepository = Depends(get_postgres_repository),
) -> AuthSessionResponse:
    try:
        resolved_email = authenticate_user(payload.email, payload.password, settings)
    except SupabaseAuthenticationError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
        ) from exc
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc

    user = repository.get_or_create_user_by_email(resolved_email)
    return AuthSessionResponse(
        access_token=create_access_token(user, settings),
        user=_serialize_user(user),
    )


@router.get("/auth/me", response_model=AuthUserResponse)
def get_me(
    current_user: UserRecord = Depends(get_current_user),
    repository: PostgresRepository = Depends(get_postgres_repository),
) -> AuthUserResponse:
    refreshed = repository.get_license_snapshot(current_user.id) or current_user
    return _serialize_user(refreshed)
