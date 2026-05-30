import csv
import io
from collections import defaultdict
from datetime import UTC, datetime
from uuid import uuid4

from app.schemas import (
    AdminUser,
    ExplainRequest,
    ExplainResponse,
    HistoryItem,
    RequestLog,
    UsagePoint,
    UsageSummary,
)


class InMemoryRepository:
    def __init__(self) -> None:
        self.history: list[HistoryItem] = [
            HistoryItem(
                id="exp_1001",
                created_at=datetime.now(UTC),
                user_email="beta01@llmexplainer.ai",
                mode="research",
                source="文本粘贴",
                text_preview="Transformer attention 机制为什么更适合长距离依赖？",
                model="gpt-4.1-mini",
                tokens=1420,
                status="success",
            ),
            HistoryItem(
                id="exp_1002",
                created_at=datetime.now(UTC),
                user_email="beta02@llmexplainer.ai",
                mode="code",
                source="网页选中",
                text_preview="解释这一段异步数据库连接池代码的作用。",
                model="gpt-4.1-mini",
                tokens=980,
                status="success",
            ),
        ]
        self.logs: list[RequestLog] = []
        self.users: list[AdminUser] = [
            AdminUser(
                id="usr_001",
                email="beta01@llmexplainer.ai",
                role="user",
                plan="trial",
                access_status="active",
                access_expires_at=None,
                daily_usage_count=9,
                daily_usage_limit=20,
                created_at=datetime.now(UTC),
            ),
            AdminUser(
                id="usr_002",
                email="beta02@llmexplainer.ai",
                role="user",
                plan="student",
                access_status="active",
                access_expires_at=None,
                daily_usage_count=17,
                daily_usage_limit=25,
                created_at=datetime.now(UTC),
            ),
            AdminUser(
                id="usr_003",
                email="ops@llmexplainer.ai",
                role="admin",
                plan="enterprise",
                access_status="active",
                access_expires_at=None,
                daily_usage_count=1,
                daily_usage_limit=999,
                created_at=datetime.now(UTC),
            ),
        ]
        self.request_counts: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))

    def get_user_request_count(self, user_email: str) -> int:
        date_key = datetime.now(UTC).date().isoformat()
        return self.request_counts[user_email][date_key]

    def increment_user_request(self, user_email: str) -> int:
        date_key = datetime.now(UTC).date().isoformat()
        self.request_counts[user_email][date_key] += 1
        return self.request_counts[user_email][date_key]

    def add_history(
        self,
        request: ExplainRequest,
        response: ExplainResponse,
        status: str,
        source: str = "文本粘贴",
    ) -> HistoryItem:
        item = HistoryItem(
            id=f"exp_{uuid4().hex[:10]}",
            created_at=datetime.now(UTC),
            user_email=request.user_email,
            mode=request.mode,
            source=source,
            text_preview=request.input_text[:80],
            model=response.meta.model,
            tokens=max(len(request.input_text) // 2, 120),
            status=status,
        )
        self.history.insert(0, item)
        return item

    def add_log(
        self,
        user_email: str,
        model: str,
        provider: str,
        status: str,
        latency_ms: int,
        error_message: str | None = None,
    ) -> RequestLog:
        item = RequestLog(
            id=f"log_{uuid4().hex[:10]}",
            created_at=datetime.now(UTC),
            user_email=user_email,
            model=model,
            provider=provider,
            status=status,
            latency_ms=latency_ms,
            error_message=error_message,
        )
        self.logs.insert(0, item)
        return item

    def list_history(self, user_email: str | None = None, limit: int = 50) -> list[HistoryItem]:
        items = self.history
        if user_email:
            items = [item for item in items if item.user_email == user_email]
        return items[:limit]

    def export_history_csv(self, user_email: str | None = None) -> str:
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(
            ["id", "created_at", "user_email", "mode", "source", "text_preview", "model", "tokens", "status"]
        )
        for item in self.list_history(user_email=user_email, limit=500):
            writer.writerow(
                [
                    item.id,
                    item.created_at.isoformat(),
                    item.user_email,
                    item.mode,
                    item.source,
                    item.text_preview,
                    item.model,
                    item.tokens,
                    item.status,
                ]
            )
        return output.getvalue()

    def usage_summary(self) -> UsageSummary:
        latencies = [log.latency_ms for log in self.logs] or [2000]
        success_count = len([log for log in self.logs if log.status == "success"])
        error_count = len([log for log in self.logs if log.status != "success"])
        return UsageSummary(
            total_requests_today=len(self.logs),
            successful_requests_today=success_count,
            failed_requests_today=error_count,
            average_latency_ms=int(sum(latencies) / len(latencies)),
            active_users=len({item.user_email for item in self.history}),
            series=[
                UsagePoint(label="Mon", requests=14),
                UsagePoint(label="Tue", requests=22),
                UsagePoint(label="Wed", requests=18),
                UsagePoint(label="Thu", requests=27),
                UsagePoint(label="Fri", requests=31),
                UsagePoint(label="Sat", requests=16),
                UsagePoint(label="Sun", requests=11),
            ],
        )

    def list_users(self) -> list[AdminUser]:
        return self.users

    def list_logs(self) -> list[RequestLog]:
        return self.logs
