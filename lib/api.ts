export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

type GetToken = () => Promise<string | null>;

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
    try {
      const json = (await response.json()) as { message?: string };
      detail = json.message ?? detail;
    } catch {
      // Ignore parse failures and keep fallback detail.
    }
    throw new Error(`Request failed (${response.status}): ${detail}`);
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

export type InsightSummary = {
  items: InsightItem[];
  windowStart: string;
  windowEnd: string;
  engineVersion: string;
};

export function getInsightsSummary(getToken: GetToken) {
  return authFetch<InsightSummary>(getToken, "/api/insights/summary");
}

