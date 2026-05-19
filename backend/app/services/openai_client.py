import json
import time
from uuid import uuid4

from app.config import Settings
from app.schemas import ExplainResponse, KeywordItem


class OpenAIExplainClient:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def generate_explanation(
        self,
        input_text: str,
        mode: str,
        model: str,
        provider: str,
        output_language: str = "zh-CN",
    ) -> ExplainResponse:
        started_at = time.perf_counter()

        if self.settings.mock_ai_responses:
            return self._mock_response(
                input_text=input_text,
                mode=mode,
                model=model,
                provider=provider,
                output_language=output_language,
                latency_ms=int((time.perf_counter() - started_at) * 1000) + 480,
            )

        if not self.settings.openai_api_key:
            raise RuntimeError("后端未配置 OPENAI_API_KEY，请先在环境变量中填写。")

        try:
            from openai import OpenAI

            client = OpenAI(
                api_key=self.settings.openai_api_key,
                base_url=self.settings.openai_base_url or None,
            )
            completion = client.chat.completions.create(
                model=model,
                temperature=0.25,
                response_format={"type": "json_object"},
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "你是一个专业解释助手。请将输入内容解释为 JSON，"
                            "字段必须包含 summary, deep_explanation, keywords, examples, takeaway。"
                        ),
                    },
                    {
                        "role": "user",
                        "content": (
                            f"模式: {mode}\n"
                            f"{self._language_instruction(output_language)}\n"
                            f"待解释文本:\n{input_text}"
                        ),
                    },
                ],
            )
            raw_content = completion.choices[0].message.content or "{}"
            parsed = json.loads(raw_content)
        except Exception as exc:  # pragma: no cover - networked provider branch
            raise RuntimeError(f"OpenAI 调用失败: {exc}") from exc

        latency_ms = int((time.perf_counter() - started_at) * 1000)
        return ExplainResponse(
            summary=parsed.get("summary", "未返回摘要"),
            deep_explanation=parsed.get("deep_explanation", "未返回深度解释"),
            keywords=self._normalize_keywords(parsed.get("keywords", [])),
            examples=self._normalize_examples(parsed.get("examples", [])),
            takeaway=parsed.get("takeaway", "未返回总结"),
            meta={
                "model": model,
                "provider": provider,
                "latency_ms": latency_ms,
                "request_id": f"req_{uuid4().hex[:12]}",
            },
        )

    def _normalize_keywords(self, raw_keywords: object) -> list[KeywordItem]:
        if isinstance(raw_keywords, dict):
            items = [raw_keywords]
        elif isinstance(raw_keywords, list):
            items = raw_keywords
        elif isinstance(raw_keywords, str) and raw_keywords.strip():
            items = [raw_keywords]
        else:
            items = []

        normalized: list[KeywordItem] = []
        for item in items:
            if isinstance(item, dict):
                normalized.append(
                    KeywordItem(
                        term=str(item.get("term", "关键词")),
                        definition=str(item.get("definition", "暂无定义")),
                    )
                )
                continue

            if isinstance(item, str) and item.strip():
                normalized.append(
                    KeywordItem(
                        term=item.strip(),
                        definition="暂无定义",
                    )
                )

        return normalized

    def _normalize_examples(self, raw_examples: object) -> list[str]:
        if isinstance(raw_examples, list):
            return [str(item).strip() for item in raw_examples if str(item).strip()]

        if isinstance(raw_examples, str) and raw_examples.strip():
            return [raw_examples.strip()]

        return []

    def _mock_response(
        self,
        input_text: str,
        mode: str,
        model: str,
        provider: str,
        output_language: str,
        latency_ms: int,
    ) -> ExplainResponse:
        preview = input_text[:160] + ("..." if len(input_text) > 160 else "")
        summary_copy, deep_copy, keyword_definition, example_a, example_b, takeaway_copy = (
            self._mock_language_pack(output_language)
        )
        return ExplainResponse(
            summary=f"{summary_copy}{preview}",
            deep_explanation=deep_copy,
            keywords=[
                KeywordItem(term="Core Focus", definition=keyword_definition[0]),
                KeywordItem(term="Reasoning Path", definition=keyword_definition[1]),
                KeywordItem(term="Use Case", definition=keyword_definition[2]),
            ],
            examples=[
                example_a,
                example_b,
            ],
            takeaway=takeaway_copy,
            meta={
                "model": model,
                "provider": provider,
                "latency_ms": latency_ms,
                "request_id": f"req_{uuid4().hex[:12]}",
            },
        )

    def _language_instruction(self, output_language: str) -> str:
        instructions = {
            "zh-CN": "请用简体中文输出。",
            "en": "Please respond in English.",
            "ko": "한국어로 설명해 주세요.",
            "ja": "日本語で説明してください。",
        }
        return instructions.get(output_language, instructions["zh-CN"])

    def _mock_language_pack(
        self, output_language: str
    ) -> tuple[str, str, tuple[str, str, str], str, str, str]:
        packs = {
            "zh-CN": (
                "这是当前模式下的简明解释：",
                "这段内容可以先看核心问题，再看内部机制，最后回到真实使用场景，这样最容易形成完整理解。",
                (
                    "它试图解释或解决的主要对象。",
                    "内容内部如何一步步成立。",
                    "这个解释最适合落地的场景。",
                ),
                "如果面向初学者，可以先把抽象术语换成生活化类比。",
                "如果面向专业读者，可以继续补充边界条件、前提和限制。",
                "先抓住主问题，再拆机制，最后回到使用场景，理解会更稳定。",
            ),
            "en": (
                "Here is the concise explanation for this mode: ",
                "Read the passage in three layers: identify the main question, unpack the internal mechanism, and then connect it back to a practical use case.",
                (
                    "The main issue the content is trying to explain.",
                    "How the reasoning holds together step by step.",
                    "Where this explanation becomes most useful in practice.",
                ),
                "For beginners, start with a familiar analogy before introducing formal terms.",
                "For expert readers, add assumptions, edge cases, and limitations.",
                "Understand the main question first, then the mechanism, and finally the real-world use case.",
            ),
            "ko": (
                "현재 모드의 간단한 설명입니다: ",
                "이 내용은 핵심 질문, 내부 작동 방식, 실제 활용 장면의 세 층으로 나누어 보면 이해하기 쉽습니다.",
                (
                    "이 내용이 설명하려는 핵심 대상입니다.",
                    "논리가 어떤 순서로 성립하는지 보여 줍니다.",
                    "이 설명이 실제로 가장 유용한 상황입니다.",
                ),
                "입문자에게는 먼저 익숙한 비유로 개념을 연결해 주는 것이 좋습니다.",
                "전문 독자에게는 가정, 한계, 적용 범위를 함께 설명할 수 있습니다.",
                "핵심 질문을 먼저 잡고, 작동 원리를 본 뒤, 실제 활용으로 연결하면 이해가 훨씬 안정적입니다.",
            ),
            "ja": (
                "このモードでの要点説明です: ",
                "内容は、中心的な問い、内部の仕組み、実際の利用場面という三つの層に分けて考えると理解しやすくなります。",
                (
                    "その内容が説明しようとしている中心テーマです。",
                    "論理がどのような順序で成り立つかを示します。",
                    "この説明が実際に役立つ場面です。",
                ),
                "初学者には、まず身近なたとえから入ると理解しやすくなります。",
                "専門読者には、前提条件や限界、適用範囲も補うと有効です。",
                "最初に問いをつかみ、次に仕組みを見て、最後に実際の用途へ戻すと理解が安定します。",
            ),
        }
        return packs.get(output_language, packs["zh-CN"])
