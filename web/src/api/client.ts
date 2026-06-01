import {
  createWealthStackApi,
  type TokenPair,
  type TokenStorage,
} from "@wealth-stack/shared";

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "";

const storage: TokenStorage = {
  getAccessToken() {
    return localStorage.getItem("access_token");
  },
  getRefreshToken() {
    return localStorage.getItem("refresh_token");
  },
  setTokens(tokens: TokenPair) {
    localStorage.setItem("access_token", tokens.access_token);
    localStorage.setItem("refresh_token", tokens.refresh_token);
  },
  clearTokens() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  },
};

const apiClient = createWealthStackApi({ baseUrl, storage });

export function setTokens(tokens: TokenPair): void {
  storage.setTokens(tokens);
}

export function clearTokens(): void {
  storage.clearTokens();
}

export function isAuthenticated(): boolean {
  return apiClient.isAuthenticated();
}

export const api = {
  register: (email: string, password: string) =>
    apiClient.register(email, password),
  login: (email: string, password: string) => apiClient.login(email, password),
  dashboardSummary: () => apiClient.dashboardSummary(),
  listAccounts: () => apiClient.listAccounts(),
  createAccount: (name: string, currency?: string, accountType?: string) =>
    apiClient.createAccount(name, currency, accountType),
  listTransactions: () => apiClient.listTransactions(),
  createTransaction: (
    accountId: string,
    amount: string,
    transactionType: "income" | "expense",
    note?: string,
  ) => apiClient.createTransaction(accountId, amount, transactionType, note),
};
