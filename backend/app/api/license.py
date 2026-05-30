from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import get_current_user
from app.dependencies import get_postgres_repository
from app.repositories.postgres import (
    LicenseActivationError,
    PostgresRepository,
    UserRecord,
)
from app.schemas import (
    LicenseActivateRequest,
    LicenseStatusResponse,
)

router = APIRouter(tags=["license"])


def _serialize_license_status(user: UserRecord) -> LicenseStatusResponse:
    return LicenseStatusResponse(
        plan=user.plan,
        access_status=user.access_status,
        access_expires_at=user.access_expires_at,
        daily_usage_count=user.daily_usage_count,
        daily_usage_limit=user.daily_usage_limit,
    )


@router.post("/license/activate", response_model=LicenseStatusResponse)
def activate_license(
    payload: LicenseActivateRequest,
    current_user: UserRecord = Depends(get_current_user),
    repository: PostgresRepository = Depends(get_postgres_repository),
) -> LicenseStatusResponse:
    try:
        repository.activate_license(current_user.id, payload.code)
    except LicenseActivationError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    refreshed = repository.get_license_snapshot(current_user.id)
    if not refreshed:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User was not found after activation.",
        )

    return _serialize_license_status(refreshed)


@router.get("/license/me", response_model=LicenseStatusResponse)
def get_my_license(
    current_user: UserRecord = Depends(get_current_user),
    repository: PostgresRepository = Depends(get_postgres_repository),
) -> LicenseStatusResponse:
    refreshed = repository.get_license_snapshot(current_user.id)
    if not refreshed:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User was not found.",
        )

    return _serialize_license_status(refreshed)
