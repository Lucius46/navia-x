from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import require_admin_user
from app.dependencies import get_postgres_repository
from app.repositories.postgres import LicenseCodeRecord, PostgresRepository, UserRecord
from app.schemas import AdminLicenseCreateRequest, LicenseCodeResponse
from app.services.license_codes import generate_license_code

router = APIRouter(tags=["admin-licenses"])


def _serialize_license(record: LicenseCodeRecord) -> LicenseCodeResponse:
    return LicenseCodeResponse(
        id=record.id,
        code=record.code,
        plan=record.plan,
        status=record.status,
        max_activations=record.max_activations,
        used_count=record.used_count,
        duration_days=record.duration_days,
        usage_limit_per_day=record.usage_limit_per_day,
        expires_at=record.expires_at,
        created_by=record.created_by,
        created_at=record.created_at,
    )


@router.post("/admin/licenses/create", response_model=LicenseCodeResponse)
def create_license(
    payload: AdminLicenseCreateRequest,
    current_user: UserRecord = Depends(require_admin_user),
    repository: PostgresRepository = Depends(get_postgres_repository),
) -> LicenseCodeResponse:
    code = ""
    for _ in range(10):
        candidate = generate_license_code()
        if not repository.license_code_exists(candidate):
            code = candidate
            break

    if not code:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to generate a unique license code.",
        )

    record = repository.create_license(
        code=code,
        plan=payload.plan,
        duration_days=payload.duration_days,
        max_activations=payload.max_activations,
        usage_limit_per_day=payload.usage_limit_per_day,
        expires_at=payload.expires_at,
        created_by=current_user.id,
    )
    return _serialize_license(record)


@router.get("/admin/licenses", response_model=list[LicenseCodeResponse])
def list_licenses(
    _: UserRecord = Depends(require_admin_user),
    repository: PostgresRepository = Depends(get_postgres_repository),
) -> list[LicenseCodeResponse]:
    return [_serialize_license(record) for record in repository.list_license_codes()]


@router.patch("/admin/licenses/{license_id}/disable", response_model=LicenseCodeResponse)
def disable_license(
    license_id: str,
    _: UserRecord = Depends(require_admin_user),
    repository: PostgresRepository = Depends(get_postgres_repository),
) -> LicenseCodeResponse:
    record = repository.disable_license(license_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="License code was not found.",
        )

    return _serialize_license(record)
