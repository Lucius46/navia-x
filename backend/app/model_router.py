from dataclasses import dataclass

from app.config import Settings


@dataclass
class ModelDecision:
    provider: str
    model: str
    temperature: float
    max_tokens: int


class ModelRouter:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def route(self, mode: str) -> ModelDecision:
        base_model = self.settings.openai_model
        mapping = {
            "simple": ModelDecision("openai", base_model, 0.2, 700),
            "professional": ModelDecision("openai", base_model, 0.3, 900),
            "exam": ModelDecision("openai", base_model, 0.2, 900),
            "research": ModelDecision("openai", base_model, 0.2, 1100),
            "code": ModelDecision("openai", base_model, 0.1, 1100),
            "professor": ModelDecision("openai", base_model, 0.4, 1000),
            "science": ModelDecision("openai", base_model, 0.2, 1000),
            "literature": ModelDecision("openai", base_model, 0.6, 900),
        }
        return mapping.get(mode, ModelDecision("openai", base_model, 0.2, 800))

    def list_provider_status(self) -> list[dict[str, str | bool]]:
        return [
            {
                "provider": "openai",
                "enabled": True,
                "active_model": self.settings.openai_model,
                "note": "当前默认启用，生产建议通过后端环境变量提供 API Key。",
            },
            {
                "provider": "claude",
                "enabled": False,
                "active_model": "reserved",
                "note": "已预留 Router 结构，待补供应商客户端。",
            },
            {
                "provider": "gemini",
                "enabled": False,
                "active_model": "reserved",
                "note": "已预留 Router 结构，待补供应商客户端。",
            },
            {
                "provider": "qwen",
                "enabled": False,
                "active_model": "reserved",
                "note": "已预留 Router 结构，待补供应商客户端。",
            },
        ]

