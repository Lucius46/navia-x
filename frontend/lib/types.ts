export type ExplainMode =
  | "simple"
  | "professional"
  | "exam"
  | "research"
  | "code"
  | "professor"
  | "science"
  | "literature";

export type LicensePlan =
  | "trial"
  | "student"
  | "pro"
  | "enterprise"
  | "lifetime";

export type UserPlan = "free" | LicensePlan;

export type AccessStatus = "inactive" | "active" | "disabled" | "expired";

export interface KeywordItem {
  term: string;
  definition: string;
}

export interface ExplainResult {
  summary: string;
  deepExplanation: string;
  keywords: KeywordItem[];
  examples: string[];
  takeaway: string;
  model: string;
  latencyMs: number;
}

export interface ExplainRequestPayload {
  text: string;
  mode: ExplainMode;
  outputLanguage?: "zh-CN" | "en" | "ko" | "ja";
}

export interface HistoryItem {
  id: string;
  createdAt: string;
  mode: string;
  source: string;
  textPreview: string;
  model: string;
  tokens: number;
  status: "success" | "error";
}

export interface UsagePoint {
  label: string;
  requests: number;
}

export interface UsageSummary {
  totalRequestsToday: number;
  successfulRequestsToday: number;
  failedRequestsToday: number;
  averageLatencyMs: number;
  activeUsers: number;
  series: UsagePoint[];
}

export interface AuthUser {
  id: string;
  email: string;
  role: "user" | "admin";
  plan: UserPlan;
  accessStatus: AccessStatus;
  accessExpiresAt: string | null;
  dailyUsageLimit: number;
}

export interface AuthSession {
  accessToken: string;
  tokenType: "bearer";
  user: AuthUser;
}

export interface LicenseStatus {
  plan: UserPlan;
  accessStatus: AccessStatus;
  accessExpiresAt: string | null;
  dailyUsageCount: number;
  dailyUsageLimit: number;
}

export interface LicenseCodeRecord {
  id: string;
  code: string;
  plan: LicensePlan;
  status: "active" | "disabled" | "expired";
  maxActivations: number;
  usedCount: number;
  durationDays: number | null;
  usageLimitPerDay: number;
  expiresAt: string | null;
  createdBy: string | null;
  createdAt: string;
}

export interface CreateLicensePayload {
  plan: LicensePlan;
  durationDays?: number | null;
  maxActivations?: number;
  usageLimitPerDay?: number;
  expiresAt?: string | null;
}

export interface AdminUser {
  id: string;
  email: string;
  role: "user" | "admin";
  plan: UserPlan;
  accessStatus: AccessStatus;
  accessExpiresAt: string | null;
  dailyUsageCount: number;
  dailyUsageLimit: number;
  createdAt: string | null;
}

export interface AdminUserAccessPayload {
  plan?: UserPlan;
  accessStatus?: AccessStatus;
  accessExpiresAt?: string | null;
  extendDays?: number;
  dailyUsageLimit?: number;
}

export interface RequestLog {
  id: string;
  user: string;
  model: string;
  status: string;
  latencyMs: number;
  createdAt: string;
  provider?: string;
  errorMessage?: string | null;
}

export interface ModelStatus {
  provider: string;
  enabled: boolean;
  activeModel: string;
  note: string;
}
