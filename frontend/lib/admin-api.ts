import {
  adminUsers,
  modelStatuses,
  requestLogs,
  usageSummary
} from "@/lib/mock-data";
import {
  AdminUser,
  ModelStatus,
  RequestLog,
  UsageSummary
} from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");

function resolveUrl(path: string) {
  return API_BASE_URL ? `${API_BASE_URL}${path}` : path;
}

function normalizeUsage(raw: {
  total_requests_today: number;
  successful_requests_today: number;
  failed_requests_today: number;
  average_latency_ms: number;
  active_users: number;
  series: { label: string; requests: number }[];
}): UsageSummary {
  return {
    totalRequestsToday: raw.total_requests_today,
    successfulRequestsToday: raw.successful_requests_today,
    failedRequestsToday: raw.failed_requests_today,
    averageLatencyMs: raw.average_latency_ms,
    activeUsers: raw.active_users,
    series: raw.series
  };
}

function normalizeUser(raw: {
  id: string;
  email: string;
  role: string;
  status: string;
  requests_today: number;
  created_at: string;
}): AdminUser {
  return {
    id: raw.id,
    email: raw.email,
    role: raw.role,
    status: raw.status,
    requestsToday: raw.requests_today,
    createdAt: raw.created_at
  };
}

function normalizeLog(raw: {
  id: string;
  created_at: string;
  user_email: string;
  model: string;
  provider: string;
  status: string;
  latency_ms: number;
  error_message?: string | null;
}): RequestLog {
  return {
    id: raw.id,
    createdAt: raw.created_at,
    user: raw.user_email,
    model: raw.model,
    provider: raw.provider,
    status: raw.status,
    latencyMs: raw.latency_ms,
    errorMessage: raw.error_message ?? null
  };
}

function normalizeStatus(raw: {
  provider: string;
  enabled: boolean;
  active_model: string;
  note: string;
}): ModelStatus {
  return {
    provider: raw.provider,
    enabled: raw.enabled,
    activeModel: raw.active_model,
    note: raw.note
  };
}

export async function getAdminSnapshot(): Promise<{
  usage: UsageSummary;
  users: AdminUser[];
  logs: RequestLog[];
  statuses: ModelStatus[];
}> {
  if (!API_BASE_URL) {
    return {
      usage: usageSummary,
      users: adminUsers,
      logs: requestLogs,
      statuses: modelStatuses
    };
  }

  try {
    const [usageResponse, usersResponse, logsResponse, statusResponse] =
      await Promise.all([
        fetch(resolveUrl("/api/usage"), { cache: "no-store" }),
        fetch(resolveUrl("/api/admin/users"), { cache: "no-store" }),
        fetch(resolveUrl("/api/admin/logs"), { cache: "no-store" }),
        fetch(resolveUrl("/api/admin/status"), { cache: "no-store" })
      ]);

    if (
      !usageResponse.ok ||
      !usersResponse.ok ||
      !logsResponse.ok ||
      !statusResponse.ok
    ) {
      throw new Error("Admin API unavailable");
    }

    const usage = normalizeUsage(await usageResponse.json());
    const users = (await usersResponse.json()).map(normalizeUser);
    const logs = (await logsResponse.json()).map(normalizeLog);
    const statuses = (await statusResponse.json()).map(normalizeStatus);

    return { usage, users, logs, statuses };
  } catch {
    return {
      usage: usageSummary,
      users: adminUsers,
      logs: requestLogs,
      statuses: modelStatuses
    };
  }
}

