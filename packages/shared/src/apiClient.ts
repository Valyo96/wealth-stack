import type {
  Account,
  ApiEnvelope,
  CreateRecurringTransactionInput,
  DashboardSummary,
  PatchRecurringTransactionInput,
  RecurringTransaction,
  TokenPair,
  Transaction,
  UpcomingRecurringOccurrence,
  WealthStackApiConfig,
} from "./types.js";
import { ApiClientError } from "./types.js";

const DEFAULT_REQUEST_TIMEOUT_MS = 20_000;

export function createWealthStackApi(config: WealthStackApiConfig) {
  const { baseUrl, storage } = config;
  const fetchFn = config.fetchImpl ?? fetch;
  const requestTimeoutMs =
    config.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;

  let refreshPromise: Promise<TokenPair> | null = null;

  async function fetchWithTimeout(
    url: string,
    options: RequestInit = {},
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), requestTimeoutMs);
    try {
      return await fetchFn(url, {
        ...options,
        signal: options.signal ?? controller.signal,
      });
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        throw new ApiClientError(
          "network_error",
          "Request timed out. Check that the API is running and reachable from this device.",
        );
      }
      if (err instanceof TypeError) {
        throw new ApiClientError(
          "network_error",
          "Cannot reach the API. Check EXPO_PUBLIC_API_BASE_URL and your network connection.",
        );
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async function refreshTokens(): Promise<TokenPair> {
    const refreshToken = storage.getRefreshToken();
    if (!refreshToken) {
      throw new ApiClientError("unauthorized", "No refresh token");
    }
    const res = await fetchWithTimeout(`${baseUrl}/v1/auth/refresh`, {
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

    const res = await fetchWithTimeout(`${baseUrl}${path}`, {
      ...options,
      headers,
    });

    if (res.status === 401 && retryOnUnauthorized && !isAuthPath) {
      await refreshTokensSingleFlight();
      return request<T>(path, options, false);
    }

    let json: ApiEnvelope<T>;
    try {
      json = (await res.json()) as ApiEnvelope<T>;
    } catch {
      throw new ApiClientError(
        "invalid_response",
        "Server returned a non-JSON response. Check the API URL.",
      );
    }

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

    listRecurringTransactions(includeDeleted = false) {
      const q = includeDeleted ? "?include_deleted=true" : "";
      return request<RecurringTransaction[]>(
        `/v1/recurring-transactions${q}`,
      ).then((d) => d ?? []);
    },

    createRecurringTransaction(body: CreateRecurringTransactionInput) {
      return request<RecurringTransaction>("/v1/recurring-transactions", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },

    getRecurringTransaction(id: string) {
      return request<RecurringTransaction>(`/v1/recurring-transactions/${id}`);
    },

    patchRecurringTransaction(
      id: string,
      body: PatchRecurringTransactionInput,
    ) {
      return request<RecurringTransaction>(
        `/v1/recurring-transactions/${id}`,
        {
          method: "PATCH",
          body: JSON.stringify(body),
        },
      );
    },

    deleteRecurringTransaction(id: string) {
      return request<RecurringTransaction>(
        `/v1/recurring-transactions/${id}`,
        { method: "DELETE" },
      );
    },

    pauseRecurringTransaction(id: string) {
      return request<RecurringTransaction>(
        `/v1/recurring-transactions/${id}/pause`,
        { method: "POST" },
      );
    },

    resumeRecurringTransaction(id: string) {
      return request<RecurringTransaction>(
        `/v1/recurring-transactions/${id}/resume`,
        { method: "POST" },
      );
    },

    upcomingRecurringTransactions(opts?: {
      limit?: number;
      from?: string;
    }) {
      const params = new URLSearchParams();
      if (opts?.limit != null) params.set("limit", String(opts.limit));
      if (opts?.from) params.set("from", opts.from);
      const q = params.toString();
      return request<UpcomingRecurringOccurrence[]>(
        `/v1/recurring-transactions/upcoming${q ? `?${q}` : ""}`,
      ).then((d) => d ?? []);
    },
  };
}

export type WealthStackApi = ReturnType<typeof createWealthStackApi>;
