import type {
  Account,
  ApiEnvelope,
  DashboardSummary,
  TokenPair,
  Transaction,
  WealthStackApiConfig,
} from "./types.js";
import { ApiClientError } from "./types.js";

export function createWealthStackApi(config: WealthStackApiConfig) {
  const { baseUrl, storage } = config;
  const fetchFn = config.fetchImpl ?? fetch;

  let refreshPromise: Promise<TokenPair> | null = null;

  async function refreshTokens(): Promise<TokenPair> {
    const refreshToken = storage.getRefreshToken();
    if (!refreshToken) {
      throw new ApiClientError("unauthorized", "No refresh token");
    }
    const res = await fetchFn(`${baseUrl}/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    const json = (await res.json()) as ApiEnvelope<TokenPair>;
    if (json.error || !json.data) {
      await storage.clearTokens();
      throw new ApiClientError(
        json.error?.code ?? "unauthorized",
        json.error?.message ?? "Invalid refresh token",
      );
    }
    await storage.setTokens(json.data);
    return json.data;
  }

  async function refreshTokensSingleFlight(): Promise<TokenPair> {
    if (!refreshPromise) {
      refreshPromise = refreshTokens().finally(() => {
        refreshPromise = null;
      });
    }
    return refreshPromise;
  }

  async function request<T>(
    path: string,
    options: RequestInit = {},
    retryOnUnauthorized = true,
  ): Promise<T> {
    const headers = new Headers(options.headers);
    if (!headers.has("Content-Type") && options.body) {
      headers.set("Content-Type", "application/json");
    }
    const isAuthPath = path.includes("/auth/");
    const token = storage.getAccessToken();
    if (token && !isAuthPath) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const res = await fetchFn(`${baseUrl}${path}`, { ...options, headers });

    if (res.status === 401 && retryOnUnauthorized && !isAuthPath) {
      await refreshTokensSingleFlight();
      return request<T>(path, options, false);
    }

    const json = (await res.json()) as ApiEnvelope<T>;

    if (json.error) {
      throw new ApiClientError(json.error.code, json.error.message);
    }
    if (json.data === undefined) {
      throw new ApiClientError("empty_response", "Empty response from server");
    }
    return json.data;
  }

  return {
    isAuthenticated(): boolean {
      return !!storage.getAccessToken();
    },

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

    refresh() {
      return refreshTokens();
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
}

export type WealthStackApi = ReturnType<typeof createWealthStackApi>;
