from __future__ import annotations

from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import get_current_user
from app.config import Settings, get_settings
from app.dependencies import get_postgres_repository
from app.model_router import ModelRouter
from app.repositories.in_memory import InMemoryRepository
from app.repositories.postgres import PostgresRepository, UserRecord
from app.schemas import ExplainRequest, ExplainResponse
from app.services.openai_client import OpenAIExplainClient

router = APIRouter(tags=["explain"])

LICENSE_REQUIRED_MESSAGE = "Please activate a valid license code to use this feature."


def get_repository() -> InMemoryRepository:
    if not hasattr(get_repository, "_instance"):
        get_repository._instance = InMemoryRepository()  # type: ignore[attr-defined]
    return get_repository._instance  # type: ignore[attr-defined]


def _estimate_tokens_used(payload: ExplainRequest, response: ExplainResponse) -> int:
    output_text = " ".join(
        [
            response.summary,
            response.deep_explanation,
            " ".join(item.term for item in response.keywords),
            " ".join(item.definition for item in response.keywords),
            " ".join(response.examples),
            response.takeaway,
        ]
    )
    return max((len(payload.input_text) + len(output_text)) // 4, 1)


def _require_explain_access(
    user: UserRecord,
    repository: PostgresRepository,
) -> UserRecord:
    snapshot = repository.get_license_snapshot(user.id)
    if not snapshot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User was not found.",
        )

    if snapshot.access_status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=LICENSE_REQUIRED_MESSAGE,
        )

    if snapshot.access_expires_at and snapshot.access_expires_at <= datetime.now(UTC):
        repository.mark_user_access_expired(snapshot.id)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=LICENSE_REQUIRED_MESSAGE,
        )

    if snapshot.daily_usage_limit <= 0:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=LICENSE_REQUIRED_MESSAGE,
        )

    if snapshot.daily_usage_count >= snapshot.daily_usage_limit:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=LICENSE_REQUIRED_MESSAGE,
        )

    return snapshot


@router.post("/explain", response_model=ExplainResponse)
def explain_text(
    payload: ExplainRequest,
    current_user: UserRecord = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
    repository: PostgresRepository = Depends(get_postgres_repository),
) -> ExplainResponse:
    if len(payload.input_text) > settings.input_char_limit:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"单次输入最多 {settings.input_char_limit} 字。",
        )

    licensed_user = _require_explain_access(current_user, repository)

    router_service = ModelRouter(settings)
    decision = router_service.route(payload.mode)
    client = OpenAIExplainClient(settings)

    try:
        response = client.generate_explanation(
            input_text=payload.input_text,
            mode=payload.mode,
            model=decision.model,
            provider=decision.provider,
            output_language=payload.output_language,
        )
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc

    repository.record_usage(
        user_id=licensed_user.id,
        action="explain",
        model=response.meta.model,
        tokens_used=_estimate_tokens_used(payload, response),
    )
    return response
