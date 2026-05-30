import {
  AdminUser,
  AdminUserAccessPayload,
  CreateLicensePayload,
  LicenseCodeRecord,
} from "@/lib/types";
import { getAccessToken } from "@/lib/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");

function resolveUrl(path: string) {
  if (!API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured.");
  }

  return `${API_BASE_URL}${path}`;
}

function normalizeApiError(detail: unknown, fallback: string) {
  if (typeof detail === "string" && detail.trim()) {
    return detail;
  }

  if (detail && typeof detail === "object") {
    if ("detail" in detail) {
      return normalizeApiError(detail.detail, fallback);
    }
  }

  return fallback;
}

async function adminRequest<T>(
  path: string,
  init: RequestInit = {},
  fallbackMessage = "Admin request failed."
): Promise<T> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Please sign in as an admin first.");
  }

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  headers.set("Content-Type", "application/json");

  const response = await fetch(resolveUrl(path), {
    ...init,
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: fallbackMessage }));
    throw new Error(normalizeApiError(error, fallbackMessage));
  }

  return (await response.json()) as T;
}

function normalizeLicense(raw: {
  id: string;
  code: string;
  plan: LicenseCodeRecord["plan"];
  status: LicenseCodeRecord["status"];
  max_activations: number;
  used_count: number;
  duration_days: number | null;
  usage_limit_per_day: number;
  expires_at: string | null;
  created_by: string | null;
  created_at: string;
}): LicenseCodeRecord {
  return {
    id: raw.id,
    code: raw.code,
    plan: raw.plan,
    status: raw.status,
    maxActivations: raw.max_activations,
    usedCount: raw.used_count,
    durationDays: raw.duration_days,
    usageLimitPerDay: raw.usage_limit_per_day,
    expiresAt: raw.expires_at,
    createdBy: raw.created_by,
    createdAt: raw.created_at,
  };
}

function normalizeAdminUser(raw: {
  id: string;
  email: string;
  role: AdminUser["role"];
  plan: AdminUser["plan"];
  access_status: AdminUser["accessStatus"];
  access_expires_at: string | null;
  daily_usage_count: number;
  daily_usage_limit: number;
  created_at: string | null;
}): AdminUser {
  return {
    id: raw.id,
    email: raw.email,
    role: raw.role,
    plan: raw.plan,
    accessStatus: raw.access_status,
    accessExpiresAt: raw.access_expires_at,
    dailyUsageCount: raw.daily_usage_count,
    dailyUsageLimit: raw.daily_usage_limit,
    createdAt: raw.created_at,
  };
}

export async function listLicenseCodes() {
  const data = await adminRequest<
    Array<{
      id: string;
      code: string;
      plan: LicenseCodeRecord["plan"];
      status: LicenseCodeRecord["status"];
      max_activations: number;
      used_count: number;
      duration_days: number | null;
      usage_limit_per_day: number;
      expires_at: string | null;
      created_by: string | null;
      created_at: string;
    }>
  >("/api/admin/licenses", undefined, "Unable to load license codes.");

  return data.map(normalizeLicense);
}

export async function createLicenseCode(payload: CreateLicensePayload) {
  const data = await adminRequest<{
    id: string;
    code: string;
    plan: LicenseCodeRecord["plan"];
    status: LicenseCodeRecord["status"];
    max_activations: number;
    used_count: number;
    duration_days: number | null;
    usage_limit_per_day: number;
    expires_at: string | null;
    created_by: string | null;
    created_at: string;
  }>(
    "/api/admin/licenses/create",
    {
      method: "POST",
      body: JSON.stringify({
        plan: payload.plan,
        duration_days: payload.durationDays ?? null,
        max_activations: payload.maxActivations ?? 1,
        usage_limit_per_day: payload.usageLimitPerDay ?? 50,
        expires_at: payload.expiresAt ?? null,
      }),
    },
    "Unable to create a license code."
  );

  return normalizeLicense(data);
}

export async function disableLicenseCode(licenseId: string) {
  const data = await adminRequest<{
    id: string;
    code: string;
    plan: LicenseCodeRecord["plan"];
    status: LicenseCodeRecord["status"];
    max_activations: number;
    used_count: number;
    duration_days: number | null;
    usage_limit_per_day: number;
    expires_at: string | null;
    created_by: string | null;
    created_at: string;
  }>(
    `/api/admin/licenses/${licenseId}/disable`,
    {
      method: "PATCH",
      body: JSON.stringify({}),
    },
    "Unable to disable the license code."
  );

  return normalizeLicense(data);
}

export async function listAdminUsers() {
  const data = await adminRequest<
    Array<{
      id: string;
      email: string;
      role: AdminUser["role"];
      plan: AdminUser["plan"];
      access_status: AdminUser["accessStatus"];
      access_expires_at: string | null;
      daily_usage_count: number;
      daily_usage_limit: number;
      created_at: string | null;
    }>
  >("/api/admin/users", undefined, "Unable to load users.");

  return data.map(normalizeAdminUser);
}

export async function updateAdminUserAccess(
  userId: string,
  payload: AdminUserAccessPayload
) {
  const data = await adminRequest<{
    id: string;
    email: string;
    role: AdminUser["role"];
    plan: AdminUser["plan"];
    access_status: AdminUser["accessStatus"];
    access_expires_at: string | null;
    daily_usage_count: number;
    daily_usage_limit: number;
    created_at: string | null;
  }>(
    `/api/admin/users/${userId}/access`,
    {
      method: "PATCH",
      body: JSON.stringify({
        plan: payload.plan,
        access_status: payload.accessStatus,
        access_expires_at:
          payload.accessExpiresAt === undefined
            ? undefined
            : payload.accessExpiresAt,
        extend_days: payload.extendDays,
        daily_usage_limit: payload.dailyUsageLimit,
      }),
    },
    "Unable to update user access."
  );

  return normalizeAdminUser(data);
}
