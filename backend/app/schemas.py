from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field


ExplainMode = Literal[
    "simple",
    "professional",
    "exam",
    "research",
    "code",
    "professor",
    "science",
    "literature",
]


class ExplainRequest(BaseModel):
    input_text: str = Field(..., min_length=1, max_length=3000)
    mode: ExplainMode = "simple"
    user_email: EmailStr
    output_language: Literal["zh-CN", "en", "ko", "ja"] = "zh-CN"
    output_language_label: str | None = None


class KeywordItem(BaseModel):
    term: str
    definition: str


class ExplainMeta(BaseModel):
    model: str
    provider: str
    latency_ms: int
    request_id: str


class ExplainResponse(BaseModel):
    summary: str
    deep_explanation: str
    keywords: list[KeywordItem]
    examples: list[str]
    takeaway: str
    meta: ExplainMeta


class HistoryItem(BaseModel):
    id: str
    created_at: datetime
    user_email: EmailStr
    mode: str
    source: str
    text_preview: str
    model: str
    tokens: int
    status: Literal["success", "error"]


class UsagePoint(BaseModel):
    label: str
    requests: int


class UsageSummary(BaseModel):
    total_requests_today: int
    successful_requests_today: int
    failed_requests_today: int
    average_latency_ms: int
    active_users: int
    series: list[UsagePoint]


class AdminUser(BaseModel):
    id: str
    email: EmailStr
    role: str
    status: str
    requests_today: int
    created_at: datetime


class RequestLog(BaseModel):
    id: str
    created_at: datetime
    user_email: EmailStr
    model: str
    provider: str
    status: str
    latency_ms: int
    error_message: str | None = None


class ModelStatus(BaseModel):
    provider: str
    enabled: bool
    active_model: str
    note: str


class HealthResponse(BaseModel):
    status: str
    service: str
