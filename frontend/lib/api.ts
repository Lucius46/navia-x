import {
  AuthSession,
  AuthUser,
  ExplainRequestPayload,
  ExplainResult,
  LicenseStatus,
} from "@/lib/types";
import { getAccessToken } from "@/lib/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");

function resolveUrl(path: string) {
  if (!API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured.");
  }

  return `${API_BASE_URL}${path}`;
}

function normalizeApiErrorDetail(
  detail: unknown,
  fallback = "The request could not be completed."
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
      return messages.join("; ");
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

async function requestJson<T>(
  path: string,
  init: RequestInit = {},
  options: { auth?: boolean; fallbackMessage?: string } = {}
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");

  if (options.auth) {
    const token = getAccessToken();
    if (!token) {
      throw new Error("Please sign in first.");
    }
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(resolveUrl(path), {
    ...init,
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: options.fallbackMessage }));
    throw new Error(
      normalizeApiErrorDetail(
        error.detail ?? error,
        options.fallbackMessage ?? "The request could not be completed."
      )
    );
  }

  return (await response.json()) as T;
}

function normalizeAuthUser(raw: {
  id: string;
  email: string;
  role: "user" | "admin";
  plan: AuthUser["plan"];
  access_status: AuthUser["accessStatus"];
  access_expires_at: string | null;
  daily_usage_limit: number;
}): AuthUser {
  return {
    id: raw.id,
    email: raw.email,
    role: raw.role,
    plan: raw.plan,
    accessStatus: raw.access_status,
    accessExpiresAt: raw.access_expires_at,
    dailyUsageLimit: raw.daily_usage_limit,
  };
}

function normalizeSession(raw: {
  access_token: string;
  token_type: "bearer";
  user: {
    id: string;
    email: string;
    role: "user" | "admin";
    plan: AuthUser["plan"];
    access_status: AuthUser["accessStatus"];
    access_expires_at: string | null;
    daily_usage_limit: number;
  };
}): AuthSession {
  return {
    accessToken: raw.access_token,
    tokenType: raw.token_type,
    user: normalizeAuthUser(raw.user),
  };
}

function normalizeLicenseStatus(raw: {
  plan: LicenseStatus["plan"];
  access_status: LicenseStatus["accessStatus"];
  access_expires_at: string | null;
  daily_usage_count: number;
  daily_usage_limit: number;
}): LicenseStatus {
  return {
    plan: raw.plan,
    accessStatus: raw.access_status,
    accessExpiresAt: raw.access_expires_at,
    dailyUsageCount: raw.daily_usage_count,
    dailyUsageLimit: raw.daily_usage_limit,
  };
}

export async function loginUser(email: string, password: string) {
  const data = await requestJson<{
    access_token: string;
    token_type: "bearer";
    user: {
      id: string;
      email: string;
      role: "user" | "admin";
      plan: AuthUser["plan"];
      access_status: AuthUser["accessStatus"];
      access_expires_at: string | null;
      daily_usage_limit: number;
    };
  }>(
    "/api/auth/login",
    {
      method: "POST",
      body: JSON.stringify({ email, password }),
    },
    {
      fallbackMessage: "Unable to sign in.",
    }
  );

  return normalizeSession(data);
}

export async function getCurrentUser() {
  const data = await requestJson<{
    id: string;
    email: string;
    role: "user" | "admin";
    plan: AuthUser["plan"];
    access_status: AuthUser["accessStatus"];
    access_expires_at: string | null;
    daily_usage_limit: number;
  }>("/api/auth/me", undefined, {
    auth: true,
    fallbackMessage: "Unable to load the current user.",
  });

  return normalizeAuthUser(data);
}

export async function explainText(
  payload: ExplainRequestPayload
): Promise<ExplainResult> {
  const data = await requestJson<{
    summary: string;
    deep_explanation: string;
    keywords: { term: string; definition: string }[];
    examples: string[];
    takeaway: string;
    meta: { model: string; latency_ms: number };
  }>(
    "/api/explain",
    {
      method: "POST",
      body: JSON.stringify({
        input_text: payload.text,
        mode: payload.mode,
        output_language: payload.outputLanguage,
      }),
    },
    {
      auth: true,
      fallbackMessage: "The explanation service is temporarily unavailable.",
    }
  );

  return {
    summary: data.summary,
    deepExplanation: data.deep_explanation,
    keywords: data.keywords,
    examples: data.examples,
    takeaway: data.takeaway,
    model: data.meta.model,
    latencyMs: data.meta.latency_ms,
  };
}

export async function activateLicense(code: string) {
  const data = await requestJson<{
    plan: LicenseStatus["plan"];
    access_status: LicenseStatus["accessStatus"];
    access_expires_at: string | null;
    daily_usage_count: number;
    daily_usage_limit: number;
  }>(
    "/api/license/activate",
    {
      method: "POST",
      body: JSON.stringify({ code }),
    },
    {
      auth: true,
      fallbackMessage: "Unable to activate the license code.",
    }
  );

  return normalizeLicenseStatus(data);
}

export async function getMyLicenseStatus() {
  const data = await requestJson<{
    plan: LicenseStatus["plan"];
    access_status: LicenseStatus["accessStatus"];
    access_expires_at: string | null;
    daily_usage_count: number;
    daily_usage_limit: number;
  }>("/api/license/me", undefined, {
    auth: true,
    fallbackMessage: "Unable to load the billing status.",
  });

  return normalizeLicenseStatus(data);
}
