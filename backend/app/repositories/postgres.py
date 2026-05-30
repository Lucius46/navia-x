from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Any

from app.database import DatabaseManager


class LicenseActivationError(ValueError):
    pass


@dataclass
class UserRecord:
    id: str
    email: str
    role: str
    plan: str
    access_status: str
    access_expires_at: datetime | None
    daily_usage_limit: int
    created_at: datetime | None = None
    daily_usage_count: int = 0


@dataclass
class LicenseCodeRecord:
    id: str
    code: str
    plan: str
    status: str
    max_activations: int
    used_count: int
    duration_days: int | None
    usage_limit_per_day: int
    expires_at: datetime | None
    created_by: str | None
    created_at: datetime


def _effective_access_status(status_value: str, expires_at: datetime | None) -> str:
    if status_value == "active" and expires_at and expires_at <= datetime.now(UTC):
        return "expired"
    return status_value


def _calculate_user_license_expiry(
    duration_days: int | None,
    code_expires_at: datetime | None,
    activated_at: datetime,
) -> datetime | None:
    candidate = activated_at + timedelta(days=duration_days) if duration_days else None

    if candidate and code_expires_at:
        return min(candidate, code_expires_at)

    return candidate or code_expires_at


class PostgresRepository:
    def __init__(self, database: DatabaseManager) -> None:
        self.database = database

    def get_or_create_user_by_email(self, email: str) -> UserRecord:
        normalized_email = email.strip().lower()
        with self.database.connection() as connection:
            with connection.cursor() as cursor:
                existing = cursor.execute(
                    """
                    select id
                    from users
                    where lower(email) = %s
                    limit 1
                    """,
                    [normalized_email],
                ).fetchone()

                if existing:
                    row = cursor.execute(
                        """
                        update users
                        set email = %s,
                            last_login_at = now()
                        where id = %s
                        returning id,
                                  email,
                                  lower(role) as role,
                                  plan,
                                  access_status,
                                  access_expires_at,
                                  daily_usage_limit,
                                  created_at
                        """,
                        [normalized_email, existing["id"]],
                    ).fetchone()
                else:
                    row = cursor.execute(
                        """
                        insert into users (
                          email,
                          role,
                          plan,
                          access_status,
                          daily_usage_limit,
                          last_login_at
                        )
                        values (%s, 'user', 'free', 'inactive', 0, now())
                        returning id,
                                  email,
                                  lower(role) as role,
                                  plan,
                                  access_status,
                                  access_expires_at,
                                  daily_usage_limit,
                                  created_at
                        """,
                        [normalized_email],
                    ).fetchone()

        return self._map_user(row)

    def get_user_by_id(self, user_id: str) -> UserRecord | None:
        with self.database.connection() as connection:
            with connection.cursor() as cursor:
                row = cursor.execute(
                    """
                    select id,
                           email,
                           lower(role) as role,
                           plan,
                           access_status,
                           access_expires_at,
                           daily_usage_limit,
                           created_at
                    from users
                    where id = %s
                    limit 1
                    """,
                    [user_id],
                ).fetchone()

        return self._map_user(row) if row else None

    def get_license_snapshot(self, user_id: str) -> UserRecord | None:
        with self.database.connection() as connection:
            with connection.cursor() as cursor:
                row = cursor.execute(
                    """
                    select u.id,
                           u.email,
                           lower(u.role) as role,
                           u.plan,
                           u.access_status,
                           u.access_expires_at,
                           u.daily_usage_limit,
                           u.created_at,
                           coalesce((
                             select count(*)
                             from usage_logs ul
                             where ul.user_id = u.id
                               and ul.action = 'explain'
                               and date(ul.created_at at time zone 'utc') = date(now() at time zone 'utc')
                           ), 0) as daily_usage_count
                    from users u
                    where u.id = %s
                    limit 1
                    """,
                    [user_id],
                ).fetchone()

        if not row:
            return None

        user = self._map_user(row)
        user.daily_usage_count = int(row["daily_usage_count"] or 0)
        user.access_status = _effective_access_status(user.access_status, user.access_expires_at)

        if user.access_status == "expired":
            self.mark_user_access_expired(user.id)

        return user

    def mark_user_access_expired(self, user_id: str) -> None:
        with self.database.connection() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    update users
                    set access_status = 'expired'
                    where id = %s
                      and access_status = 'active'
                      and access_expires_at is not null
                      and access_expires_at <= now()
                    """,
                    [user_id],
                )

    def activate_license(self, user_id: str, code: str) -> UserRecord:
        normalized_code = code.strip().upper()
        activated_at = datetime.now(UTC)

        with self.database.connection() as connection:
            with connection.cursor() as cursor:
                license_row = cursor.execute(
                    """
                    select id,
                           code,
                           plan,
                           status,
                           max_activations,
                           used_count,
                           duration_days,
                           usage_limit_per_day,
                           expires_at,
                           created_by,
                           created_at
                    from license_codes
                    where code = %s
                    for update
                    """,
                    [normalized_code],
                ).fetchone()

                if not license_row:
                    raise LicenseActivationError("License code was not found.")

                license_record = self._map_license(license_row)

                if (
                    license_record.expires_at
                    and license_record.expires_at <= activated_at
                    and license_record.status == "active"
                ):
                    cursor.execute(
                        """
                        update license_codes
                        set status = 'expired'
                        where id = %s
                        """,
                        [license_record.id],
                    )
                    raise LicenseActivationError("This license code has expired.")

                if license_record.status != "active":
                    raise LicenseActivationError("This license code is not active.")

                if license_record.used_count >= license_record.max_activations:
                    raise LicenseActivationError("This license code has reached its activation limit.")

                existing = cursor.execute(
                    """
                    select 1
                    from user_licenses
                    where user_id = %s
                      and license_code_id = %s
                    limit 1
                    """,
                    [user_id, license_record.id],
                ).fetchone()

                if existing:
                    raise LicenseActivationError("You have already activated this license code.")

                expires_at = _calculate_user_license_expiry(
                    duration_days=license_record.duration_days,
                    code_expires_at=license_record.expires_at,
                    activated_at=activated_at,
                )

                cursor.execute(
                    """
                    insert into user_licenses (
                      user_id,
                      license_code_id,
                      plan,
                      activated_at,
                      expires_at,
                      status
                    )
                    values (%s, %s, %s, %s, %s, 'active')
                    """,
                    [
                        user_id,
                        license_record.id,
                        license_record.plan,
                        activated_at,
                        expires_at,
                    ],
                )

                cursor.execute(
                    """
                    update license_codes
                    set used_count = used_count + 1
                    where id = %s
                    """,
                    [license_record.id],
                )

                row = cursor.execute(
                    """
                    update users
                    set plan = %s,
                        access_status = 'active',
                        access_expires_at = %s,
                        daily_usage_limit = %s
                    where id = %s
                    returning id,
                              email,
                              lower(role) as role,
                              plan,
                              access_status,
                              access_expires_at,
                              daily_usage_limit,
                              created_at
                    """,
                    [
                        license_record.plan,
                        expires_at,
                        license_record.usage_limit_per_day,
                        user_id,
                    ],
                ).fetchone()

        return self._map_user(row)

    def count_usage_for_user_today(self, user_id: str) -> int:
        with self.database.connection() as connection:
            with connection.cursor() as cursor:
                row = cursor.execute(
                    """
                    select count(*) as total
                    from usage_logs
                    where user_id = %s
                      and action = 'explain'
                      and date(created_at at time zone 'utc') = date(now() at time zone 'utc')
                    """,
                    [user_id],
                ).fetchone()

        return int(row["total"] or 0)

    def record_usage(self, user_id: str, action: str, model: str | None, tokens_used: int) -> None:
        with self.database.connection() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    insert into usage_logs (user_id, action, model, tokens_used)
                    values (%s, %s, %s, %s)
                    """,
                    [user_id, action, model, max(tokens_used, 0)],
                )

    def create_license(
        self,
        *,
        code: str,
        plan: str,
        duration_days: int | None,
        max_activations: int,
        usage_limit_per_day: int,
        expires_at: datetime | None,
        created_by: str | None,
    ) -> LicenseCodeRecord:
        with self.database.connection() as connection:
            with connection.cursor() as cursor:
                row = cursor.execute(
                    """
                    insert into license_codes (
                      code,
                      plan,
                      status,
                      max_activations,
                      used_count,
                      duration_days,
                      usage_limit_per_day,
                      expires_at,
                      created_by
                    )
                    values (%s, %s, 'active', %s, 0, %s, %s, %s, %s)
                    returning id,
                              code,
                              plan,
                              status,
                              max_activations,
                              used_count,
                              duration_days,
                              usage_limit_per_day,
                              expires_at,
                              created_by,
                              created_at
                    """,
                    [
                        code,
                        plan,
                        max_activations,
                        duration_days,
                        usage_limit_per_day,
                        expires_at,
                        created_by,
                    ],
                ).fetchone()

        return self._map_license(row)

    def license_code_exists(self, code: str) -> bool:
        normalized_code = code.strip().upper()
        with self.database.connection() as connection:
            with connection.cursor() as cursor:
                row = cursor.execute(
                    """
                    select 1
                    from license_codes
                    where code = %s
                    limit 1
                    """,
                    [normalized_code],
                ).fetchone()

        return bool(row)

    def list_license_codes(self) -> list[LicenseCodeRecord]:
        with self.database.connection() as connection:
            with connection.cursor() as cursor:
                rows = cursor.execute(
                    """
                    select id,
                           code,
                           plan,
                           case
                             when status = 'active'
                              and expires_at is not null
                              and expires_at <= now()
                             then 'expired'
                             else status
                           end as status,
                           max_activations,
                           used_count,
                           duration_days,
                           usage_limit_per_day,
                           expires_at,
                           created_by,
                           created_at
                    from license_codes
                    order by created_at desc
                    """
                ).fetchall()

        return [self._map_license(row) for row in rows]

    def disable_license(self, license_id: str) -> LicenseCodeRecord | None:
        with self.database.connection() as connection:
            with connection.cursor() as cursor:
                row = cursor.execute(
                    """
                    update license_codes
                    set status = 'disabled'
                    where id = %s
                    returning id,
                              code,
                              plan,
                              status,
                              max_activations,
                              used_count,
                              duration_days,
                              usage_limit_per_day,
                              expires_at,
                              created_by,
                              created_at
                    """,
                    [license_id],
                ).fetchone()

        return self._map_license(row) if row else None

    def list_admin_users(self) -> list[UserRecord]:
        with self.database.connection() as connection:
            with connection.cursor() as cursor:
                rows = cursor.execute(
                    """
                    select u.id,
                           u.email,
                           lower(u.role) as role,
                           u.plan,
                           case
                             when u.access_status = 'active'
                              and u.access_expires_at is not null
                              and u.access_expires_at <= now()
                             then 'expired'
                             else u.access_status
                           end as access_status,
                           u.access_expires_at,
                           u.daily_usage_limit,
                           u.created_at,
                           coalesce((
                             select count(*)
                             from usage_logs ul
                             where ul.user_id = u.id
                               and ul.action = 'explain'
                               and date(ul.created_at at time zone 'utc') = date(now() at time zone 'utc')
                           ), 0) as daily_usage_count
                    from users u
                    order by u.created_at desc
                    """
                ).fetchall()

        users: list[UserRecord] = []
        for row in rows:
            user = self._map_user(row)
            user.daily_usage_count = int(row["daily_usage_count"] or 0)
            users.append(user)
        return users

    def update_user_access(
        self,
        user_id: str,
        *,
        plan: str | None,
        access_status: str | None,
        access_expires_at: datetime | None,
        daily_usage_limit: int | None,
    ) -> UserRecord | None:
        current = self.get_user_by_id(user_id)
        if not current:
            return None

        next_plan = plan or current.plan
        next_status = access_status or current.access_status
        next_expires_at = access_expires_at
        next_daily_usage_limit = (
            daily_usage_limit
            if daily_usage_limit is not None
            else current.daily_usage_limit
        )

        with self.database.connection() as connection:
            with connection.cursor() as cursor:
                row = cursor.execute(
                    """
                    update users
                    set plan = %s,
                        access_status = %s,
                        access_expires_at = %s,
                        daily_usage_limit = %s
                    where id = %s
                    returning id,
                              email,
                              lower(role) as role,
                              plan,
                              access_status,
                              access_expires_at,
                              daily_usage_limit,
                              created_at
                    """,
                    [
                        next_plan,
                        next_status,
                        next_expires_at,
                        next_daily_usage_limit,
                        user_id,
                    ],
                ).fetchone()

        return self._map_user(row) if row else None

    def _map_user(self, row: dict[str, Any] | None) -> UserRecord:
        if row is None:
            raise ValueError("Expected a user row.")

        return UserRecord(
            id=str(row["id"]),
            email=str(row["email"]),
            role=str(row["role"]).lower(),
            plan=str(row["plan"]),
            access_status=str(row["access_status"]),
            access_expires_at=row["access_expires_at"],
            daily_usage_limit=int(row["daily_usage_limit"] or 0),
            created_at=row.get("created_at"),
        )

    def _map_license(self, row: dict[str, Any]) -> LicenseCodeRecord:
        return LicenseCodeRecord(
            id=str(row["id"]),
            code=str(row["code"]),
            plan=str(row["plan"]),
            status=str(row["status"]),
            max_activations=int(row["max_activations"]),
            used_count=int(row["used_count"]),
            duration_days=(
                int(row["duration_days"])
                if row["duration_days"] is not None
                else None
            ),
            usage_limit_per_day=int(row["usage_limit_per_day"]),
            expires_at=row["expires_at"],
            created_by=str(row["created_by"]) if row["created_by"] else None,
            created_at=row["created_at"],
        )
