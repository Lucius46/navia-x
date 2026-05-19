from fastapi import FastAPI
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware

from app.admin_web import router as admin_web_router
from app.api.admin.logs import router as admin_logs_router
from app.api.admin.users import router as admin_users_router
from app.api.explain import router as explain_router
from app.api.health import router as health_router
from app.api.history import router as history_router
from app.api.usage import router as usage_router
from app.config import get_settings

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="FastAPI backend for the LLM Explainer beta MVP.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.parsed_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, prefix=settings.api_prefix)
app.include_router(explain_router, prefix=settings.api_prefix)
app.include_router(history_router, prefix=settings.api_prefix)
app.include_router(usage_router, prefix=settings.api_prefix)
app.include_router(admin_users_router, prefix=settings.api_prefix)
app.include_router(admin_logs_router, prefix=settings.api_prefix)
app.include_router(admin_web_router)


@app.get("/")
def root() -> RedirectResponse:
    return RedirectResponse(url="/admin", status_code=302)
