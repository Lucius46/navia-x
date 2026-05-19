from dataclasses import dataclass

from app.config import Settings


@dataclass
class SupabaseConfig:
    url: str | None
    anon_key: str | None
    service_role_key: str | None
    database_url: str | None

    @property
    def is_configured(self) -> bool:
        return bool(self.url and self.database_url)


class DatabaseManager:
    """Connection placeholder for Supabase/PostgreSQL integration."""

    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def get_config(self) -> SupabaseConfig:
        return SupabaseConfig(
            url=self.settings.supabase_url,
            anon_key=self.settings.supabase_anon_key,
            service_role_key=self.settings.supabase_service_role_key,
            database_url=self.settings.database_url,
        )

    def is_configured(self) -> bool:
        return self.get_config().is_configured

