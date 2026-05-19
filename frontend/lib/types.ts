export type ExplainMode =
  | "simple"
  | "professional"
  | "exam"
  | "research"
  | "code"
  | "professor"
  | "science"
  | "literature";

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
  userEmail: string;
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

export interface AdminUser {
  id: string;
  email: string;
  role: string;
  status: string;
  requestsToday: number;
  createdAt: string;
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
