from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field, field_validator


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
LicensePlan = Literal["trial", "student", "pro", "enterprise", "lifetime"]
UserPlan = Literal["free", "trial", "student", "pro", "enterprise", "lifetime"]
AccessStatus = Literal["inactive", "active", "disabled", "expired"]


class ExplainRequest(BaseModel):
    input_text: str = Field(..., min_length=1, max_length=3000)
    mode: ExplainMode = "simple"
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
    role: Literal["user", "admin"]
    plan: UserPlan
    access_status: AccessStatus
    access_expires_at: datetime | None = None
    daily_usage_count: int = 0
    daily_usage_limit: int = 0
    created_at: datetime | None = None


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


class AuthLoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)


class AuthUserResponse(BaseModel):
    id: str
    email: EmailStr
    role: Literal["user", "admin"]
    plan: UserPlan
    access_status: AccessStatus
    access_expires_at: datetime | None = None
    daily_usage_limit: int


class AuthSessionResponse(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"
    user: AuthUserResponse


class LicenseActivateRequest(BaseModel):
    code: str = Field(..., min_length=8, max_length=64)

    @field_validator("code")
    @classmethod
    def normalize_code(cls, value: str) -> str:
        return value.strip().upper()


class LicenseStatusResponse(BaseModel):
    plan: UserPlan
    access_status: AccessStatus
    access_expires_at: datetime | None = None
    daily_usage_count: int
    daily_usage_limit: int


class LicenseCodeResponse(BaseModel):
    id: str
    code: str
    plan: LicensePlan
    status: Literal["active", "disabled", "expired"]
    max_activations: int
    used_count: int
    duration_days: int | None = None
    usage_limit_per_day: int
    expires_at: datetime | None = None
    created_by: str | None = None
    created_at: datetime


class AdminLicenseCreateRequest(BaseModel):
    plan: LicensePlan
    duration_days: int | None = Field(default=None, ge=1, le=3650)
    max_activations: int = Field(default=1, ge=1, le=100000)
    usage_limit_per_day: int = Field(default=50, ge=0, le=100000)
    expires_at: datetime | None = None


class AdminUserAccessUpdateRequest(BaseModel):
    plan: UserPlan | None = None
    access_status: AccessStatus | None = None
    access_expires_at: datetime | None = None
    extend_days: int | None = Field(default=None, ge=1, le=3650)
    daily_usage_limit: int | None = Field(default=None, ge=0, le=100000)
