from fastapi import APIRouter, Depends, Query
from fastapi.responses import PlainTextResponse

from app.auth import get_current_user
from app.repositories.in_memory import InMemoryRepository
from app.repositories.postgres import UserRecord
from app.schemas import HistoryItem

from .explain import get_repository

router = APIRouter(tags=["history"])


@router.get("/history", response_model=list[HistoryItem])
def list_history(
    user_email: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    current_user: UserRecord = Depends(get_current_user),
    repository: InMemoryRepository = Depends(get_repository),
) -> list[HistoryItem]:
    target_email = (
        user_email
        if current_user.role == "admin" and user_email
        else current_user.email
    )
    return repository.list_history(user_email=target_email, limit=limit)


@router.get("/history/export")
def export_history(
    format: str = Query(default="json", pattern="^(json|csv)$"),
    user_email: str | None = Query(default=None),
    current_user: UserRecord = Depends(get_current_user),
    repository: InMemoryRepository = Depends(get_repository),
):
    target_email = (
        user_email
        if current_user.role == "admin" and user_email
        else current_user.email
    )

    if format == "csv":
        csv_content = repository.export_history_csv(user_email=target_email)
        return PlainTextResponse(
            content=csv_content,
            media_type="text/csv",
            headers={
                "Content-Disposition": "attachment; filename=history_export.csv"
            },
        )

    return repository.list_history(user_email=target_email, limit=500)
