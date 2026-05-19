import { ExplainRequestPayload, ExplainResult } from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");

function normalizeApiErrorDetail(
  detail: unknown,
  fallback = "解释服务暂时不可用。"
) {
  if (typeof detail === "string" && detail.trim()) {
    return detail;
  }

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }

        if (item && typeof item === "object") {
          if ("msg" in item && typeof item.msg === "string") {
            return item.msg;
          }

          if ("message" in item && typeof item.message === "string") {
            return item.message;
          }
        }

        return "";
      })
      .filter(Boolean);

    if (messages.length > 0) {
      return messages.join("；");
    }
  }

  if (detail && typeof detail === "object") {
    if ("detail" in detail) {
      return normalizeApiErrorDetail(detail.detail, fallback);
    }

    if ("message" in detail && typeof detail.message === "string") {
      return detail.message;
    }
  }

  return fallback;
}

export async function explainText(
  payload: ExplainRequestPayload
): Promise<ExplainResult> {
  if (!API_BASE_URL) {
    throw new Error(
      "前端未配置 NEXT_PUBLIC_API_BASE_URL，当前解释请求必须统一走后端。"
    );
  }

  const endpoint = `${API_BASE_URL}/api/explain`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      input_text: payload.text,
      mode: payload.mode,
      user_email: payload.userEmail,
      output_language: payload.outputLanguage
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      detail: "解释服务暂时不可用。"
    }));
    throw new Error(normalizeApiErrorDetail(error.detail ?? error));
  }

  const data = await response.json();

  return {
    summary: data.summary,
    deepExplanation: data.deep_explanation,
    keywords: data.keywords,
    examples: data.examples,
    takeaway: data.takeaway,
    model: data.meta.model,
    latencyMs: data.meta.latency_ms
  };
}
