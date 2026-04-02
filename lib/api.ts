function normalizeBaseUrl(raw: string) {
  const trimmed = raw.trim();
  return trimmed.endsWith("/") ? trimmed.replace(/\/+$/, "") : trimmed;
}

export const API_BASE_URL = normalizeBaseUrl(
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:4000"
);

type GetToken = () => Promise<string | null>;

export class ApiRequestError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(status: number, message: string, options?: { code?: string }) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = options?.code;
  }
}

export function toUserFriendlyErrorMessage(error: unknown) {
  if (error instanceof ApiRequestError) {
    if (error.status === 404) {
      return "Can’t reach the server right now. Check your API URL and try again.";
    }
    if (error.status === 401) {
      return "Your session expired. Please sign in again.";
    }
    if (error.status >= 500) {
      return "Server error. Please try again in a moment.";
    }
    return error.message || "Request failed.";
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Something went wrong. Please try again.";
}

async function authFetch<T>(
  getToken: GetToken,
  path: string,
  init?: RequestInit
): Promise<T> {
  const token = await getToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    let detail = response.statusText;
    let code: string | undefined;
    try {
      const json = (await response.json()) as { message?: string; code?: string };
      detail = json.message ?? detail;
      code = json.code;
    } catch {
      // Ignore parse failures and keep fallback detail.
    }
    throw new ApiRequestError(response.status, detail, { code });
  }

  return (await response.json()) as T;
}

export type ApiSubscription = {
  _id: string;
  name: string;
  plan?: string | null;
  category?: string | null;
  paymentMethod?: string | null;
  status?: string | null;
  startDate?: string | null;
  price: number;
  currency?: string | null;
  billing: string;
  renewalDate?: string | null;
  color?: string | null;
};

export function listSubscriptions(getToken: GetToken) {
  return authFetch<ApiSubscription[]>(getToken, "/api/subscriptions");
}

export function createSubscription(
  getToken: GetToken,
  payload: Omit<ApiSubscription, "_id">
) {
  return authFetch<ApiSubscription>(getToken, "/api/subscriptions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export type InsightItem = {
  code: string;
  score: number;
  band: string;
  confidence: number;
  topFactors: string[];
  description: string;
  suggestion: string;
};

export type LinkedAccountSpend = {
  itemId: string;
  institutionName: string;
  total: number;
  currency: string;
  transactionCount: number;
};

export type CashflowSummary = {
  monthLabel: string;
  monthStart: string;
  monthEnd: string;
  currentMonthTotal: number;
  previousMonthTotal: number;
  monthOverMonthPercent: number | null;
  dominantCurrency: string;
  categoryTotals: { category: string; total: number; currency: string }[];
  topMerchants: { merchant: string; total: number; count: number }[];
  /** Present after API deploy; empty array when no bank activity. */
  linkedAccountSpend?: LinkedAccountSpend[];
};

export type BudgetStatus = {
  id: string;
  category: string;
  monthlyLimit: number;
  currency: string;
  spent: number;
  spendCurrency: string;
  remaining: number;
  status: "ok" | "warning" | "over";
};

export type InsightSummary = {
  items: InsightItem[];
  windowStart: string;
  windowEnd: string;
  engineVersion: string;
  insightsUpdatedAt?: string;
  cashflow: CashflowSummary;
  budgetStatuses: BudgetStatus[];
};

export function getInsightsSummary(getToken: GetToken) {
  return authFetch<InsightSummary>(getToken, "/api/insights/summary");
}

export function recomputeInsights(getToken: GetToken) {
  return authFetch<{
    message: string;
    snapshot: InsightSummary;
    features: Record<string, number>;
  }>(getToken, "/api/insights/recompute", { method: "POST" });
}

export type ApiBudget = {
  _id: string;
  clerkUserId: string;
  categoryKey: string;
  displayCategory: string;
  monthlyLimit: number;
  currency: string;
};

export function listBudgets(getToken: GetToken) {
  return authFetch<ApiBudget[]>(getToken, "/api/budgets");
}

export function upsertBudget(
  getToken: GetToken,
  body: { category: string; monthlyLimit: number; currency?: string }
) {
  return authFetch<ApiBudget>(getToken, "/api/budgets", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function deleteBudget(getToken: GetToken, id: string) {
  return authFetch<{ message: string }>(getToken, `/api/budgets/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export type PlaidLinkTokenResponse = {
  provider: string;
  linkToken: string;
  expiration: string;
  requestId: string;
};

export function createPlaidLinkToken(
  getToken: GetToken,
  body: { countryCode?: "US" | "GB"; androidPackageName?: string }
) {
  return authFetch<PlaidLinkTokenResponse>(getToken, "/api/bank/link-token", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function exchangePlaidPublicToken(
  getToken: GetToken,
  body: {
    publicToken: string;
    countryCode?: "US" | "GB";
    metadata?: {
      institution?: { institution_id?: string; name?: string };
      accounts?: { id: string }[];
    };
  }
) {
  return authFetch<{
    message: string;
    itemId: string;
    connectedAccountId: string;
    institutionName?: string | null;
    institutionId?: string | null;
  }>(getToken, "/api/bank/exchange-token", {
    method: "POST",
    body: JSON.stringify({
      publicToken: body.publicToken,
      countryCode: body.countryCode,
      metadata: body.metadata,
    }),
  });
}

export function syncBankTransactions(getToken: GetToken) {
  return authFetch<{
    message: string;
    linkedAccounts: number;
    results: Array<{
      itemId: string;
      ok: boolean;
      pages?: number;
      added?: number;
      modified?: number;
      removed?: number;
      error?: string;
    }>;
  }>(getToken, "/api/bank/sync", { method: "POST" });
}

export type BankConnection = {
  _id: string;
  clerkUserId: string;
  provider: string;
  itemId: string;
  countryCode?: "US" | "GB" | null;
  institutionId?: string | null;
  institutionName?: string | null;
  plaidAccountIds?: string[];
  status: string;
  lastSyncAt?: string | null;
  lastSyncError?: string | null;
  transactionsCursor?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export function listBankConnections(getToken: GetToken) {
  return authFetch<BankConnection[]>(getToken, "/api/bank/connections");
}

export type NormalizedTransaction = {
  _id: string;
  amount: number;
  currency: string;
  merchant: string;
  category: string;
  occurredAt: string;
  sourceType: string;
  sourceRef?: string | null;
  pending?: boolean;
  plaidCategoryLabels?: string[];
  linkedItemId?: string | null;
  institutionName?: string | null;
};

export function listTransactions(
  getToken: GetToken,
  query?: {
    page?: number;
    limit?: number;
    sourceType?: string;
    startDate?: string;
    endDate?: string;
    category?: string;
    linkedItemId?: string;
  }
) {
  const params = new URLSearchParams();
  if (query?.page) params.set("page", String(query.page));
  if (query?.limit) params.set("limit", String(query.limit));
  if (query?.sourceType) params.set("sourceType", query.sourceType);
  if (query?.startDate) params.set("startDate", query.startDate);
  if (query?.endDate) params.set("endDate", query.endDate);
  if (query?.category) params.set("category", query.category);
  if (query?.linkedItemId) params.set("linkedItemId", query.linkedItemId);
  const q = params.toString();
  return authFetch<{
    items: NormalizedTransaction[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }>(getToken, `/api/transactions${q ? `?${q}` : ""}`);
}

