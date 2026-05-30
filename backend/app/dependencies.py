from __future__ import annotations

from functools import lru_cache

from fastapi import HTTPException, status

from app.database import get_database_manager
from app.repositories.postgres import PostgresRepository


@lru_cache
def _build_repository() -> PostgresRepository:
    return PostgresRepository(get_database_manager())


def get_postgres_repository() -> PostgresRepository:
    database = get_database_manager()
    if not database.is_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database access is not configured for this environment.",
        )

    return _build_repository()
