from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "LLM Explainer API"
    app_env: str = "development"
    api_prefix: str = "/api"
    frontend_origin: str = "http://localhost:3000"
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"

    openai_api_key: str | None = None
    google_api_key: str | None = None
    dashscope_api_key: str | None = None
    openrouter_api_key: str | None = None
    xai_api_key: str | None = None
    openai_base_url: str | None = None
    openai_model: str = "gpt-4.1-mini"
    mock_ai_responses: bool = True

    admin_email: str = "admin@example.com"
    admin_password: str = "change_me_admin_password"
    admin_name: str = "LLM Explainer Admin"
    admin_session_secret: str | None = None
    jwt_secret: str = "change_me_jwt_secret"
    auth_token_ttl_hours: int = 12

    daily_request_limit: int = 20
    input_char_limit: int = 3000

    database_url: str | None = None
    supabase_url: str | None = None
    supabase_anon_key: str | None = None
    supabase_service_role_key: str | None = None

    invite_codes: str = Field(default="BETA-MAY-2026")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False
    )

    @property
    def parsed_cors_origins(self) -> list[str]:
        origins = [item.strip() for item in self.cors_origins.split(",") if item.strip()]
        if self.frontend_origin and self.frontend_origin not in origins:
            origins.append(self.frontend_origin)
        return origins

    @property
    def parsed_invite_codes(self) -> set[str]:
        return {item.strip() for item in self.invite_codes.split(",") if item.strip()}

    @property
    def resolved_admin_session_secret(self) -> str:
        secret = (self.admin_session_secret or self.jwt_secret).strip()
        return secret or "change_me_jwt_secret"

    @property
    def uses_default_admin_password(self) -> bool:
        return self.admin_password == "change_me_admin_password"

    @property
    def uses_default_jwt_secret(self) -> bool:
        return self.resolved_admin_session_secret == "change_me_jwt_secret"


@lru_cache
def get_settings() -> Settings:
    return Settings()
