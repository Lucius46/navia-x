from fastapi import APIRouter, Depends

from app.repositories.in_memory import InMemoryRepository
from app.schemas import UsageSummary

from .explain import get_repository

router = APIRouter(tags=["usage"])


@router.get("/usage", response_model=UsageSummary)
def get_usage(
    repository: InMemoryRepository = Depends(get_repository),
) -> UsageSummary:
    return repository.usage_summary()

