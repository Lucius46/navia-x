import {
  AdminUser,
  HistoryItem,
  ModelStatus,
  RequestLog,
  UsagePoint,
  UsageSummary
} from "@/lib/types";

export const modeOptions = [
  { value: "simple", label: "简单解释", note: "把复杂内容讲清楚" },
  { value: "professional", label: "专业解释", note: "保留术语和逻辑链" },
  { value: "exam", label: "考试理解", note: "适合背诵和应试" },
  { value: "research", label: "论文理解", note: "拆解研究问题与方法" },
  { value: "code", label: "代码解释", note: "按工程语境说明" },
  { value: "professor", label: "教授模式", note: "像导师一样循序渐进" },
  { value: "science", label: "科学模式", note: "偏结构化和实证" },
  { value: "literature", label: "文学模式", note: "强调语义与语境" }
] as const;

export const historyItems: HistoryItem[] = [
  {
    id: "exp_1001",
    createdAt: "2026-05-07T08:32:00.000Z",
    mode: "论文理解",
    source: "文本粘贴",
    textPreview: "Transformer attention 机制为什么可以替代循环结构？",
    model: "gpt-4.1-mini",
    tokens: 1420,
    status: "success"
  },
  {
    id: "exp_1002",
    createdAt: "2026-05-07T06:16:00.000Z",
    mode: "代码解释",
    source: "网页选中",
    textPreview: "解释这一段 Python 异步数据库连接池代码的作用。",
    model: "gpt-4.1-mini",
    tokens: 980,
    status: "success"
  },
  {
    id: "exp_1003",
    createdAt: "2026-05-06T14:04:00.000Z",
    mode: "简单解释",
    source: "PDF 摘录",
    textPreview: "边际成本与规模经济之间的关系是什么？",
    model: "gpt-4.1-mini",
    tokens: 1204,
    status: "error"
  }
];

export const usageSeries: UsagePoint[] = [
  { label: "Mon", requests: 14 },
  { label: "Tue", requests: 22 },
  { label: "Wed", requests: 18 },
  { label: "Thu", requests: 27 },
  { label: "Fri", requests: 31 },
  { label: "Sat", requests: 16 },
  { label: "Sun", requests: 11 }
];

export const usageSummary: UsageSummary = {
  totalRequestsToday: 128,
  successfulRequestsToday: 121,
  failedRequestsToday: 7,
  averageLatencyMs: 2130,
  activeUsers: 24,
  series: usageSeries
};

export const adminUsers: AdminUser[] = [
  {
    id: "usr_001",
    email: "beta01@llmexplainer.ai",
    role: "Tester",
    status: "Active",
    requestsToday: 9,
    createdAt: "2026-05-01T03:00:00.000Z"
  },
  {
    id: "usr_002",
    email: "beta02@llmexplainer.ai",
    role: "Tester",
    status: "Active",
    requestsToday: 17,
    createdAt: "2026-05-02T05:30:00.000Z"
  },
  {
    id: "usr_003",
    email: "ops@llmexplainer.ai",
    role: "Admin",
    status: "Invited",
    requestsToday: 1,
    createdAt: "2026-05-05T11:12:00.000Z"
  }
];

export const requestLogs: RequestLog[] = [
  {
    id: "log_4001",
    user: "beta01@llmexplainer.ai",
    model: "gpt-4.1-mini",
    status: "success",
    latencyMs: 2150,
    createdAt: "2026-05-07T08:32:00.000Z",
    provider: "openai",
    errorMessage: null
  },
  {
    id: "log_4002",
    user: "beta02@llmexplainer.ai",
    model: "gpt-4.1-mini",
    status: "success",
    latencyMs: 1870,
    createdAt: "2026-05-07T08:17:00.000Z",
    provider: "openai",
    errorMessage: null
  },
  {
    id: "log_4003",
    user: "beta02@llmexplainer.ai",
    model: "gpt-4.1-mini",
    status: "error",
    latencyMs: 3205,
    createdAt: "2026-05-07T07:55:00.000Z",
    provider: "openai",
    errorMessage: "Provider timeout"
  }
];

export const modelStatuses: ModelStatus[] = [
  {
    provider: "openai",
    enabled: true,
    activeModel: "gpt-4.1-mini",
    note: "当前由后端统一代理，用于浏览器扩展与后台解释请求。"
  },
  {
    provider: "claude",
    enabled: false,
    activeModel: "reserved",
    note: "路由位已预留，待补供应商凭证和客户端。"
  },
  {
    provider: "gemini",
    enabled: false,
    activeModel: "reserved",
    note: "路由位已预留，待补供应商凭证和客户端。"
  }
];

