from fastapi import APIRouter, Depends, HTTPException, status

from app.config import Settings, get_settings
from app.model_router import ModelRouter
from app.repositories.in_memory import InMemoryRepository
from app.schemas import ExplainRequest, ExplainResponse
from app.services.openai_client import OpenAIExplainClient

router = APIRouter(tags=["explain"])


def get_repository() -> InMemoryRepository:
    if not hasattr(get_repository, "_instance"):
        get_repository._instance = InMemoryRepository()  # type: ignore[attr-defined]
    return get_repository._instance  # type: ignore[attr-defined]


@router.post("/explain", response_model=ExplainResponse)
def explain_text(
    payload: ExplainRequest,
    settings: Settings = Depends(get_settings),
    repository: InMemoryRepository = Depends(get_repository),
) -> ExplainResponse:
    if len(payload.input_text) > settings.input_char_limit:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"单次输入最多 {settings.input_char_limit} 字。",
        )

    used_today = repository.get_user_request_count(payload.user_email)
    if used_today >= settings.daily_request_limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"每位测试用户每天最多 {settings.daily_request_limit} 次解释。",
        )

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
        repository.increment_user_request(payload.user_email)
        repository.add_history(payload, response, status="success")
        repository.add_log(
            user_email=payload.user_email,
            model=response.meta.model,
            provider=response.meta.provider,
            status="success",
            latency_ms=response.meta.latency_ms,
        )
        return response
    except RuntimeError as exc:
        repository.add_log(
            user_email=payload.user_email,
            model=decision.model,
            provider=decision.provider,
            status="error",
            latency_ms=0,
            error_message=str(exc),
        )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc
