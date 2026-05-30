from fastapi import APIRouter, Depends

from app.auth import require_admin_user
from app.repositories.postgres import UserRecord
from app.repositories.in_memory import InMemoryRepository
from app.schemas import UsageSummary

from .explain import get_repository

router = APIRouter(tags=["usage"])


@router.get("/usage", response_model=UsageSummary)
def get_usage(
    _: UserRecord = Depends(require_admin_user),
    repository: InMemoryRepository = Depends(get_repository),
) -> UsageSummary:
    return repository.usage_summary()
