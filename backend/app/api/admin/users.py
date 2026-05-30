from __future__ import annotations

from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import require_admin_user
from app.dependencies import get_postgres_repository
from app.repositories.postgres import PostgresRepository, UserRecord
from app.schemas import AdminUser, AdminUserAccessUpdateRequest

router = APIRouter(tags=["admin-users"])


def _serialize_admin_user(user: UserRecord) -> AdminUser:
    return AdminUser(
        id=user.id,
        email=user.email,
        role=user.role,
        plan=user.plan,
        access_status=user.access_status,
        access_expires_at=user.access_expires_at,
        daily_usage_count=user.daily_usage_count,
        daily_usage_limit=user.daily_usage_limit,
        created_at=user.created_at,
    )


@router.get("/admin/users", response_model=list[AdminUser])
def list_users(
    _: UserRecord = Depends(require_admin_user),
    repository: PostgresRepository = Depends(get_postgres_repository),
) -> list[AdminUser]:
    return [_serialize_admin_user(user) for user in repository.list_admin_users()]


@router.patch("/admin/users/{user_id}/access", response_model=AdminUser)
def update_user_access(
    user_id: str,
    payload: AdminUserAccessUpdateRequest,
    _: UserRecord = Depends(require_admin_user),
    repository: PostgresRepository = Depends(get_postgres_repository),
) -> AdminUser:
    current_user = repository.get_license_snapshot(user_id)
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User was not found.",
        )

    next_expires_at = (
        payload.access_expires_at
        if "access_expires_at" in payload.model_fields_set
        else current_user.access_expires_at
    )
    if payload.extend_days:
        base = current_user.access_expires_at
        if not base or base <= datetime.now(UTC):
            base = datetime.now(UTC)
        next_expires_at = base + timedelta(days=payload.extend_days)

    updated = repository.update_user_access(
        user_id,
        plan=payload.plan,
        access_status=payload.access_status or ("active" if payload.extend_days else None),
        access_expires_at=next_expires_at,
        daily_usage_limit=payload.daily_usage_limit,
    )
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User was not found.",
        )

    refreshed = repository.get_license_snapshot(updated.id) or updated
    return _serialize_admin_user(refreshed)
