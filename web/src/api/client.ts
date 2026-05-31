import type {
  Account,
  ApiEnvelope,
  DashboardSummary,
  TokenPair,
  Transaction,
} from "./types";
import { ApiClientError } from "./types";

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "";

function getAccessToken(): string | null {
  return localStorage.getItem("access_token");
}

export function setTokens(tokens: TokenPair): void {
  localStorage.setItem("access_token", tokens.access_token);
  localStorage.setItem("refresh_token", tokens.refresh_token);
}

export function clearTokens(): void {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  const token = getAccessToken();
  if (token && !path.includes("/auth/")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${baseUrl}${path}`, { ...options, headers });
  const json = (await res.json()) as ApiEnvelope<T>;

  if (json.error) {
    throw new ApiClientError(json.error.code, json.error.message);
  }
  if (json.data === undefined) {
    throw new ApiClientError("empty_response", "Empty response from server");
  }
  return json.data;
}

export const api = {
  register(email: string, password: string) {
    return request<TokenPair>("/v1/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  login(email: string, password: string) {
    return request<TokenPair>("/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  dashboardSummary() {
    return request<DashboardSummary>("/v1/dashboard/summary");
  },

  listAccounts() {
    return request<Account[]>("/v1/accounts").then((d) => d ?? []);
  },

  createAccount(name: string, currency = "USD", accountType = "cash") {
    return request<Account>("/v1/accounts", {
      method: "POST",
      body: JSON.stringify({
        name,
        currency,
        account_type: accountType,
      }),
    });
  },

  listTransactions() {
    return request<Transaction[]>("/v1/transactions").then((d) => d ?? []);
  },

  createTransaction(
    accountId: string,
    amount: string,
    transactionType: "income" | "expense",
    note?: string,
  ) {
    return request<Transaction>("/v1/transactions", {
      method: "POST",
      body: JSON.stringify({
        account_id: accountId,
        amount,
        transaction_type: transactionType,
        note: note || undefined,
      }),
    });
  },
};
