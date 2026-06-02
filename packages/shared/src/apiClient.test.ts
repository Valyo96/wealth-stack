import { createWealthStackApi } from "./apiClient.js";
import { ApiClientError, type TokenPair, type TokenStorage } from "./types.js";

function createMemoryStorage(): TokenStorage & {
  access: string | null;
  refresh: string | null;
} {
  const store = { access: null as string | null, refresh: null as string | null };
  return {
    get access() {
      return store.access;
    },
    set access(v: string | null) {
      store.access = v;
    },
    get refresh() {
      return store.refresh;
    },
    set refresh(v: string | null) {
      store.refresh = v;
    },
    getAccessToken: () => store.access,
    getRefreshToken: () => store.refresh,
    setTokens: (tokens: TokenPair) => {
      store.access = tokens.access_token;
      store.refresh = tokens.refresh_token;
    },
    clearTokens: () => {
      store.access = null;
      store.refresh = null;
    },
  };
}

const tokens: TokenPair = {
  access_token: "access",
  refresh_token: "refresh",
  expires_in: 900,
};

describe("createWealthStackApi", () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllTimers();
  });

  it("parses error envelope", async () => {
    const storage = createMemoryStorage();
    const fetchImpl = jest.fn().mockResolvedValue({
      status: 400,
      json: async () => ({
        error: { code: "bad_request", message: "invalid JSON body" },
      }),
    });

    const api = createWealthStackApi({
      baseUrl: "http://api.test",
      storage,
      fetchImpl: fetchImpl as typeof fetch,
    });

    await expect(api.login("a@b.com", "password123")).rejects.toMatchObject({
      code: "bad_request",
      message: "invalid JSON body",
    });
  });

  it("logs in and stores tokens", async () => {
    const storage = createMemoryStorage();
    const fetchImpl = jest.fn().mockResolvedValue({
      status: 200,
      json: async () => ({ data: tokens }),
    });

    const api = createWealthStackApi({
      baseUrl: "http://api.test",
      storage,
      fetchImpl: fetchImpl as typeof fetch,
    });

    const result = await api.login("a@b.com", "password123");
    expect(result).toEqual(tokens);
    expect(fetchImpl).toHaveBeenCalledWith(
      "http://api.test/v1/auth/login",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("registers a user", async () => {
    const storage = createMemoryStorage();
    const fetchImpl = jest.fn().mockResolvedValue({
      status: 200,
      json: async () => ({ data: tokens }),
    });

    const api = createWealthStackApi({
      baseUrl: "http://api.test",
      storage,
      fetchImpl: fetchImpl as typeof fetch,
    });

    await api.register("new@b.com", "password123");
    expect(fetchImpl).toHaveBeenCalledWith(
      "http://api.test/v1/auth/register",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("reports empty response", async () => {
    const storage = createMemoryStorage();
    const fetchImpl = jest.fn().mockResolvedValue({
      status: 200,
      json: async () => ({}),
    });

    const api = createWealthStackApi({
      baseUrl: "http://api.test",
      storage,
      fetchImpl: fetchImpl as typeof fetch,
    });

    await expect(api.login("a@b.com", "password123")).rejects.toMatchObject({
      code: "empty_response",
    });
  });

  it("reports invalid JSON response", async () => {
    const storage = createMemoryStorage();
    const fetchImpl = jest.fn().mockResolvedValue({
      status: 200,
      json: async () => {
        throw new SyntaxError("bad json");
      },
    });

    const api = createWealthStackApi({
      baseUrl: "http://api.test",
      storage,
      fetchImpl: fetchImpl as typeof fetch,
    });

    await expect(api.login("a@b.com", "password123")).rejects.toMatchObject({
      code: "invalid_response",
    });
  });

  it("times out when fetch hangs", async () => {
    jest.useFakeTimers();
    const storage = createMemoryStorage();
    const fetchImpl = jest.fn(
      (_url: string, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            const err = new Error("Aborted");
            err.name = "AbortError";
            reject(err);
          });
        }),
    );

    const api = createWealthStackApi({
      baseUrl: "http://api.test",
      storage,
      fetchImpl: fetchImpl as typeof fetch,
      requestTimeoutMs: 1000,
    });

    const pending = api.login("a@b.com", "password123");
    jest.advanceTimersByTime(1000);

    await expect(pending).rejects.toMatchObject({ code: "network_error" });
  });

  it("maps fetch TypeError to network_error", async () => {
    const storage = createMemoryStorage();
    const fetchImpl = jest.fn().mockRejectedValue(new TypeError("Failed to fetch"));

    const api = createWealthStackApi({
      baseUrl: "http://api.test",
      storage,
      fetchImpl: fetchImpl as typeof fetch,
    });

    await expect(api.login("a@b.com", "password123")).rejects.toMatchObject({
      code: "network_error",
    });
  });

  it("retries once after 401 using refresh token", async () => {
    const storage = createMemoryStorage();
    storage.setTokens({
      access_token: "old-access",
      refresh_token: "refresh-token",
      expires_in: 900,
    });

    const fetchImpl = jest
      .fn()
      .mockResolvedValueOnce({
        status: 401,
        json: async () => ({ error: { code: "unauthorized", message: "expired" } }),
      })
      .mockResolvedValueOnce({
        status: 200,
        json: async () => ({ data: tokens }),
      })
      .mockResolvedValueOnce({
        status: 200,
        json: async () => ({
          data: {
            total_income: "100",
            total_expenses: "50",
            net: "50",
            period_label: "May 2026",
            period_start: "2026-05-01",
            period_end: "2026-05-31",
          },
        }),
      });

    const api = createWealthStackApi({
      baseUrl: "http://api.test",
      storage,
      fetchImpl: fetchImpl as typeof fetch,
    });

    const summary = await api.dashboardSummary();
    expect(summary.net).toBe("50");
    expect(storage.getAccessToken()).toBe("access");
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it("refresh fails without refresh token", async () => {
    const storage = createMemoryStorage();
    const api = createWealthStackApi({
      baseUrl: "http://api.test",
      storage,
      fetchImpl: jest.fn() as typeof fetch,
    });

    await expect(api.refresh()).rejects.toMatchObject({
      code: "unauthorized",
      message: "No refresh token",
    });
  });

  it("lists accounts and transactions", async () => {
    const storage = createMemoryStorage();
    storage.setTokens(tokens);
    const fetchImpl = jest
      .fn()
      .mockResolvedValueOnce({
        status: 200,
        json: async () => ({
          data: [{ id: "a1", name: "Cash", currency: "USD", account_type: "cash" }],
        }),
      })
      .mockResolvedValueOnce({
        status: 200,
        json: async () => ({
          data: [
            {
              id: "t1",
              account_id: "a1",
              amount: "10",
              transaction_type: "expense",
              occurred_at: "2026-05-01",
            },
          ],
        }),
      });

    const api = createWealthStackApi({
      baseUrl: "http://api.test",
      storage,
      fetchImpl: fetchImpl as typeof fetch,
    });

    const accounts = await api.listAccounts();
    expect(accounts).toHaveLength(1);
    const txs = await api.listTransactions();
    expect(txs[0]?.amount).toBe("10");
  });

  it("creates account and transaction", async () => {
    const storage = createMemoryStorage();
    storage.setTokens(tokens);
    const fetchImpl = jest
      .fn()
      .mockResolvedValueOnce({
        status: 200,
        json: async () => ({
          data: { id: "a1", name: "Savings", currency: "USD", account_type: "cash" },
        }),
      })
      .mockResolvedValueOnce({
        status: 200,
        json: async () => ({
          data: {
            id: "t1",
            account_id: "a1",
            amount: "25",
            transaction_type: "income",
            occurred_at: "2026-05-01",
          },
        }),
      });

    const api = createWealthStackApi({
      baseUrl: "http://api.test",
      storage,
      fetchImpl: fetchImpl as typeof fetch,
    });

    const account = await api.createAccount("Savings");
    expect(account.name).toBe("Savings");
    const tx = await api.createTransaction("a1", "25", "income", "paycheck");
    expect(tx.transaction_type).toBe("income");
  });

  it("isAuthenticated reflects storage", () => {
    const storage = createMemoryStorage();
    const api = createWealthStackApi({
      baseUrl: "http://api.test",
      storage,
    });
    expect(api.isAuthenticated()).toBe(false);
    storage.setTokens(tokens);
    expect(api.isAuthenticated()).toBe(true);
  });

  it("manages recurring transactions", async () => {
    const storage = createMemoryStorage();
    storage.setTokens(tokens);

    const recurring: import("./types.js").RecurringTransaction = {
      id: "r1",
      user_id: "u1",
      account_id: "a1",
      amount: "50.00",
      transaction_type: "expense",
      frequency: "monthly",
      day_of_month: 1,
      timezone: "UTC",
      start_date: "2026-06-01",
      next_execution_at: "2026-06-01T00:00:00Z",
      paused: false,
      created_at: "2026-05-01T00:00:00Z",
      updated_at: "2026-05-01T00:00:00Z",
    };

    const fetchImpl = jest
      .fn()
      .mockResolvedValueOnce({
        status: 200,
        json: async () => ({ data: [recurring] }),
      })
      .mockResolvedValueOnce({
        status: 200,
        json: async () => ({ data: recurring }),
      })
      .mockResolvedValueOnce({
        status: 200,
        json: async () => ({ data: { ...recurring, paused: true } }),
      })
      .mockResolvedValueOnce({
        status: 200,
        json: async () => ({ data: recurring }),
      })
      .mockResolvedValueOnce({
        status: 200,
        json: async () => ({
          data: { ...recurring, deleted_at: "2026-06-02T00:00:00Z" },
        }),
      })
      .mockResolvedValueOnce({
        status: 200,
        json: async () => ({
          data: [
            {
              recurring_transaction_id: "r1",
              amount: "50.00",
              transaction_type: "expense",
              scheduled_for: "2026-06-01T00:00:00Z",
            },
          ],
        }),
      });

    const api = createWealthStackApi({
      baseUrl: "http://api.test",
      storage,
      fetchImpl: fetchImpl as typeof fetch,
    });

    const list = await api.listRecurringTransactions();
    expect(list).toHaveLength(1);

    const created = await api.createRecurringTransaction({
      account_id: "a1",
      amount: "50",
      transaction_type: "expense",
      frequency: "monthly",
      day_of_month: 1,
      start_date: "2026-06-01",
    });
    expect(created.id).toBe("r1");

    const paused = await api.pauseRecurringTransaction("r1");
    expect(paused.paused).toBe(true);

    await api.resumeRecurringTransaction("r1");
    await api.deleteRecurringTransaction("r1");

    const upcoming = await api.upcomingRecurringTransactions();
    expect(upcoming[0]?.recurring_transaction_id).toBe("r1");

    expect(fetchImpl).toHaveBeenCalledWith(
      "http://api.test/v1/recurring-transactions/r1/pause",
      expect.objectContaining({ method: "POST" }),
    );
    expect(fetchImpl).toHaveBeenCalledWith(
      "http://api.test/v1/recurring-transactions/upcoming",
      expect.anything(),
    );
  });
});
