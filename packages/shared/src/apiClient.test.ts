import { createWealthStackApi } from "./apiClient.js";
import type { TokenPair, TokenStorage } from "./types.js";

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

describe("createWealthStackApi", () => {
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
        json: async () => ({
          data: {
            access_token: "new-access",
            refresh_token: "new-refresh",
            expires_in: 900,
          },
        }),
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
    expect(storage.getAccessToken()).toBe("new-access");
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });
});
