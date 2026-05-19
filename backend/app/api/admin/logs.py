from fastapi import APIRouter, Depends

from app.admin_auth import require_admin_session
from app.config import Settings, get_settings
from app.model_router import ModelRouter
from app.repositories.in_memory import InMemoryRepository
from app.schemas import ModelStatus, RequestLog

from ..explain import get_repository

router = APIRouter(tags=["admin-logs"], dependencies=[Depends(require_admin_session)])


@router.get("/admin/logs", response_model=list[RequestLog])
def list_logs(
    repository: InMemoryRepository = Depends(get_repository),
) -> list[RequestLog]:
    return repository.list_logs()


@router.get("/admin/status", response_model=list[ModelStatus])
def list_model_status(
    settings: Settings = Depends(get_settings),
) -> list[ModelStatus]:
    router_service = ModelRouter(settings)
    return [
        ModelStatus(**item) for item in router_service.list_provider_status()
    ]
