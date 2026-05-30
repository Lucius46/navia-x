from __future__ import annotations

from contextlib import contextmanager
from dataclasses import dataclass
from functools import lru_cache
from typing import Iterator

import psycopg
from psycopg.rows import dict_row

from app.config import Settings, get_settings


@dataclass
class SupabaseConfig:
    url: str | None
    anon_key: str | None
    service_role_key: str | None
    database_url: str | None

    @property
    def is_configured(self) -> bool:
        return bool(self.url and self.anon_key and self.database_url)


class DatabaseManager:
    """Thin psycopg connection helper for the Supabase Postgres instance."""

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

    @contextmanager
    def connection(self) -> Iterator[psycopg.Connection]:
        config = self.get_config()
        if not config.database_url:
            raise RuntimeError("DATABASE_URL is not configured.")

        with psycopg.connect(config.database_url, row_factory=dict_row) as connection:
            yield connection


@lru_cache
def get_database_manager() -> DatabaseManager:
    return DatabaseManager(get_settings())
