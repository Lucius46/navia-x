from fastapi import APIRouter, Depends

from app.admin_auth import require_admin_session
from app.repositories.in_memory import InMemoryRepository
from app.schemas import AdminUser

from ..explain import get_repository

router = APIRouter(tags=["admin-users"], dependencies=[Depends(require_admin_session)])


@router.get("/admin/users", response_model=list[AdminUser])
def list_users(
    repository: InMemoryRepository = Depends(get_repository),
) -> list[AdminUser]:
    return repository.list_users()
