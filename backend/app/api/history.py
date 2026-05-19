from fastapi import APIRouter, Depends, Query
from fastapi.responses import PlainTextResponse

from app.repositories.in_memory import InMemoryRepository
from app.schemas import HistoryItem

from .explain import get_repository

router = APIRouter(tags=["history"])


@router.get("/history", response_model=list[HistoryItem])
def list_history(
    user_email: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    repository: InMemoryRepository = Depends(get_repository),
) -> list[HistoryItem]:
    return repository.list_history(user_email=user_email, limit=limit)


@router.get("/history/export")
def export_history(
    format: str = Query(default="json", pattern="^(json|csv)$"),
    user_email: str | None = Query(default=None),
    repository: InMemoryRepository = Depends(get_repository),
):
    if format == "csv":
        csv_content = repository.export_history_csv(user_email=user_email)
        return PlainTextResponse(
            content=csv_content,
            media_type="text/csv",
            headers={
                "Content-Disposition": "attachment; filename=history_export.csv"
            },
        )

    return repository.list_history(user_email=user_email, limit=500)

