from __future__ import annotations

from datetime import UTC, datetime, timedelta
from unittest import TestCase
from unittest.mock import patch

from fastapi.testclient import TestClient

from app.auth import decode_access_token
from app.config import Settings, get_settings
from app.dependencies import get_postgres_repository
from app.main import app
from app.repositories.postgres import LicenseActivationError, LicenseCodeRecord, UserRecord
from app.schemas import ExplainMeta, ExplainResponse, HistoryItem, KeywordItem, RequestLog
from app.api.explain import get_repository


class FakePostgresRepository:
    def __init__(self) -> None:
        self.user = UserRecord(
            id="user-1",
            email="user@example.com",
            role="user",
            plan="free",
            access_status="inactive",
            access_expires_at=None,
            daily_usage_limit=0,
            created_at=datetime.now(UTC),
            daily_usage_count=0,
        )
        self.admin = UserRecord(
            id="admin-1",
            email="admin@example.com",
            role="admin",
            plan="enterprise",
            access_status="active",
            access_expires_at=None,
            daily_usage_limit=999,
            created_at=datetime.now(UTC),
            daily_usage_count=0,
        )
        self.users = {self.user.id: self.user, self.admin.id: self.admin}
        self.users_by_email = {
            self.user.email: self.user,
            self.admin.email: self.admin,
        }
        self.usage: list[tuple[str, str, str | None, int]] = []
        self.licenses = [
            LicenseCodeRecord(
                id="lic-1",
                code="NAVIA-TEST-AAAA-BBBB",
                plan="pro",
                status="active",
                max_activations=1,
                used_count=0,
                duration_days=30,
                usage_limit_per_day=77,
                expires_at=datetime.now(UTC) + timedelta(days=30),
                created_by=self.admin.id,
                created_at=datetime.now(UTC),
            )
        ]

    def get_or_create_user_by_email(self, email: str) -> UserRecord:
        normalized = email.strip().lower()
        existing = self.users_by_email.get(normalized)
        if existing:
            return existing
        created = UserRecord(
            id=f"user-{len(self.users) + 1}",
            email=normalized,
            role="user",
            plan="free",
            access_status="inactive",
            access_expires_at=None,
            daily_usage_limit=0,
            created_at=datetime.now(UTC),
            daily_usage_count=0,
        )
        self.users[created.id] = created
        self.users_by_email[created.email] = created
        return created

    def get_user_by_id(self, user_id: str) -> UserRecord | None:
        return self.users.get(user_id)

    def get_license_snapshot(self, user_id: str) -> UserRecord | None:
        return self.users.get(user_id)

    def mark_user_access_expired(self, user_id: str) -> None:
        self.users[user_id].access_status = "expired"

    def activate_license(self, user_id: str, code: str) -> UserRecord:
        if code != "NAVIA-TEST-AAAA-BBBB":
            raise LicenseActivationError("License code was not found.")
        user = self.users[user_id]
        user.plan = "pro"
        user.access_status = "active"
        user.access_expires_at = datetime.now(UTC) + timedelta(days=30)
        user.daily_usage_limit = 77
        return user

    def record_usage(self, user_id: str, action: str, model: str | None, tokens_used: int) -> None:
        self.usage.append((user_id, action, model, tokens_used))
        self.users[user_id].daily_usage_count += 1

    def license_code_exists(self, code: str) -> bool:
        return any(item.code == code for item in self.licenses)

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
        record = LicenseCodeRecord(
            id=f"lic-{len(self.licenses) + 1}",
            code=code,
            plan=plan,
            status="active",
            max_activations=max_activations,
            used_count=0,
            duration_days=duration_days,
            usage_limit_per_day=usage_limit_per_day,
            expires_at=expires_at,
            created_by=created_by,
            created_at=datetime.now(UTC),
        )
        self.licenses.insert(0, record)
        return record

    def list_license_codes(self) -> list[LicenseCodeRecord]:
        return list(self.licenses)

    def disable_license(self, license_id: str) -> LicenseCodeRecord | None:
        for item in self.licenses:
            if item.id == license_id:
                item.status = "disabled"
                return item
        return None

    def list_admin_users(self) -> list[UserRecord]:
        return [self.user, self.admin]

    def update_user_access(
        self,
        user_id: str,
        *,
        plan: str | None,
        access_status: str | None,
        access_expires_at: datetime | None,
        daily_usage_limit: int | None,
    ) -> UserRecord | None:
        user = self.users.get(user_id)
        if not user:
            return None
        if plan is not None:
            user.plan = plan
        if access_status is not None:
            user.access_status = access_status
        user.access_expires_at = access_expires_at
        if daily_usage_limit is not None:
            user.daily_usage_limit = daily_usage_limit
        return user


class FakeHistoryRepository:
    def __init__(self) -> None:
        now = datetime.now(UTC)
        self._history = [
            HistoryItem(
                id="exp-user",
                created_at=now,
                user_email="user@example.com",
                mode="professional",
                source="text",
                text_preview="User-only history row",
                model="gpt-4.1-mini",
                tokens=100,
                status="success",
            ),
            HistoryItem(
                id="exp-admin",
                created_at=now,
                user_email="admin@example.com",
                mode="professional",
                source="text",
                text_preview="Admin-only history row",
                model="gpt-4.1-mini",
                tokens=120,
                status="success",
            ),
        ]
        self._logs = [
            RequestLog(
                id="log-1",
                created_at=now,
                user_email="user@example.com",
                model="gpt-4.1-mini",
                provider="openai",
                status="success",
                latency_ms=500,
                error_message=None,
            )
        ]

    def list_history(self, user_email: str | None = None, limit: int = 50) -> list[HistoryItem]:
        items = self._history
        if user_email:
            items = [item for item in items if item.user_email == user_email]
        return items[:limit]

    def export_history_csv(self, user_email: str | None = None) -> str:
        rows = self.list_history(user_email=user_email, limit=500)
        return "\n".join([item.user_email for item in rows])

    def usage_summary(self):
        from app.schemas import UsagePoint, UsageSummary

        return UsageSummary(
            total_requests_today=1,
            successful_requests_today=1,
            failed_requests_today=0,
            average_latency_ms=500,
            active_users=1,
            series=[UsagePoint(label="Mon", requests=1)],
        )

    def list_logs(self) -> list[RequestLog]:
        return list(self._logs)


class AccessControlTests(TestCase):
    def setUp(self) -> None:
        self.repo = FakePostgresRepository()
        self.history_repo = FakeHistoryRepository()
        self.settings = Settings(
            jwt_secret="x" * 32,
            mock_ai_responses=True,
            input_char_limit=3000,
            database_url="postgresql://fake",
            supabase_url="https://example.supabase.co",
            supabase_anon_key="anon-key",
        )

        app.dependency_overrides[get_postgres_repository] = lambda: self.repo
        app.dependency_overrides[get_settings] = lambda: self.settings
        app.dependency_overrides[get_repository] = lambda: self.history_repo
        self.client = TestClient(app)

        with patch(
            "app.api.auth.authenticate_user",
            side_effect=lambda email, password, settings: email.strip().lower(),
        ):
            self.user_token = self.client.post(
                "/api/auth/login",
                json={"email": "user@example.com", "password": "password123"},
            ).json()["access_token"]
            self.admin_token = self.client.post(
                "/api/auth/login",
                json={"email": "admin@example.com", "password": "password123"},
            ).json()["access_token"]

    def tearDown(self) -> None:
        app.dependency_overrides.clear()

    def test_login_and_token_decoding(self) -> None:
        payload = decode_access_token(self.user_token, self.settings)
        self.assertEqual(payload["sub"], self.repo.user.id)
        self.assertEqual(payload["email"], self.repo.user.email)

    def test_explain_requires_activation_then_records_usage(self) -> None:
        blocked = self.client.post(
            "/api/explain",
            headers={"Authorization": f"Bearer {self.user_token}"},
            json={"input_text": "hello", "mode": "professional", "output_language": "en"},
        )
        self.assertEqual(blocked.status_code, 403)
        self.assertEqual(
            blocked.json()["detail"],
            "Please activate a valid license code to use this feature.",
        )

        activated = self.client.post(
            "/api/license/activate",
            headers={"Authorization": f"Bearer {self.user_token}"},
            json={"code": "NAVIA-TEST-AAAA-BBBB"},
        )
        self.assertEqual(activated.status_code, 200)
        self.assertEqual(activated.json()["plan"], "pro")

        allowed = self.client.post(
            "/api/explain",
            headers={"Authorization": f"Bearer {self.user_token}"},
            json={"input_text": "transformers", "mode": "professional", "output_language": "en"},
        )
        self.assertEqual(allowed.status_code, 200)
        self.assertTrue(self.repo.usage)
        self.assertEqual(self.repo.usage[-1][0], self.repo.user.id)
        self.assertEqual(self.repo.usage[-1][1], "explain")

    def test_admin_routes_require_admin_role(self) -> None:
        denied = self.client.get(
            "/api/admin/licenses",
            headers={"Authorization": f"Bearer {self.user_token}"},
        )
        self.assertEqual(denied.status_code, 403)

        created = self.client.post(
            "/api/admin/licenses/create",
            headers={"Authorization": f"Bearer {self.admin_token}"},
            json={
                "plan": "student",
                "duration_days": 14,
                "max_activations": 2,
                "usage_limit_per_day": 55,
            },
        )
        self.assertEqual(created.status_code, 200)
        self.assertTrue(created.json()["code"].startswith("NAVIA-"))

    def test_history_usage_and_logs_follow_unified_permissions(self) -> None:
        history_denied = self.client.get("/api/history")
        self.assertEqual(history_denied.status_code, 401)

        user_history = self.client.get(
            "/api/history?user_email=admin@example.com",
            headers={"Authorization": f"Bearer {self.user_token}"},
        )
        self.assertEqual(user_history.status_code, 200)
        self.assertEqual(len(user_history.json()), 1)
        self.assertEqual(user_history.json()[0]["user_email"], "user@example.com")

        admin_history = self.client.get(
            "/api/history?user_email=admin@example.com",
            headers={"Authorization": f"Bearer {self.admin_token}"},
        )
        self.assertEqual(admin_history.status_code, 200)
        self.assertEqual(len(admin_history.json()), 1)
        self.assertEqual(admin_history.json()[0]["user_email"], "admin@example.com")

        usage_denied = self.client.get(
            "/api/usage",
            headers={"Authorization": f"Bearer {self.user_token}"},
        )
        self.assertEqual(usage_denied.status_code, 403)

        usage_allowed = self.client.get(
            "/api/usage",
            headers={"Authorization": f"Bearer {self.admin_token}"},
        )
        self.assertEqual(usage_allowed.status_code, 200)

        logs_allowed = self.client.get(
            "/api/admin/logs",
            headers={"Authorization": f"Bearer {self.admin_token}"},
        )
        self.assertEqual(logs_allowed.status_code, 200)

