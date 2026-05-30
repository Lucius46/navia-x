from fastapi import APIRouter, Depends

from app.auth import require_admin_user
from app.config import Settings, get_settings
from app.repositories.postgres import UserRecord
from app.model_router import ModelRouter
from app.repositories.in_memory import InMemoryRepository
from app.schemas import ModelStatus, RequestLog

from ..explain import get_repository

router = APIRouter(tags=["admin-logs"])


@router.get("/admin/logs", response_model=list[RequestLog])
def list_logs(
    _: UserRecord = Depends(require_admin_user),
    repository: InMemoryRepository = Depends(get_repository),
) -> list[RequestLog]:
    return repository.list_logs()


@router.get("/admin/status", response_model=list[ModelStatus])
def list_model_status(
    _: UserRecord = Depends(require_admin_user),
    settings: Settings = Depends(get_settings),
) -> list[ModelStatus]:
    router_service = ModelRouter(settings)
    return [
        ModelStatus(**item) for item in router_service.list_provider_status()
    ]
