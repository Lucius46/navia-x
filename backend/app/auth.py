from __future__ import annotations

from datetime import UTC, datetime, timedelta

import jwt
from fastapi import Depends, Header, HTTPException, status

from app.config import Settings, get_settings
from app.dependencies import get_postgres_repository
from app.repositories.postgres import PostgresRepository, UserRecord


def create_access_token(user: UserRecord, settings: Settings) -> str:
    issued_at = datetime.now(UTC)
    payload = {
        "sub": user.id,
        "email": user.email,
        "iat": int(issued_at.timestamp()),
        "exp": int((issued_at + timedelta(hours=settings.auth_token_ttl_hours)).timestamp()),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


def decode_access_token(token: str, settings: Settings) -> dict[str, str | int]:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
    except jwt.ExpiredSignatureError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired. Please sign in again.",
        ) from exc
    except jwt.InvalidTokenError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token.",
        ) from exc


def _extract_bearer_token(authorization: str | None) -> str:
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication is required.",
        )

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Bearer authentication is required.",
        )

    return token.strip()


def get_current_user(
    authorization: str | None = Header(default=None),
    settings: Settings = Depends(get_settings),
    repository: PostgresRepository = Depends(get_postgres_repository),
) -> UserRecord:
    payload = decode_access_token(_extract_bearer_token(authorization), settings)
    user_id = str(payload.get("sub") or "").strip()
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token is missing a subject.",
        )

    user = repository.get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authenticated user no longer exists.",
        )

    return user


def require_admin_user(
    current_user: UserRecord = Depends(get_current_user),
) -> UserRecord:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access is required.",
        )

    return current_user
