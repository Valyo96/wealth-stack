import { createWealthStackApi, type TokenPair, type TokenStorage } from "@wealth-stack/shared";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";

const ACCESS_KEY = "access_token";
const REFRESH_KEY = "refresh_token";

export const apiBaseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ??
  "http://10.0.2.2:8080";

// SecureStore is async; cache tokens in memory for the shared HTTP client.
let cachedAccess: string | null = null;
let cachedRefresh: string | null = null;

export async function hydrateTokenCache(): Promise<void> {
  cachedAccess = await SecureStore.getItemAsync(ACCESS_KEY);
  cachedRefresh = await SecureStore.getItemAsync(REFRESH_KEY);
}

const syncStorage: TokenStorage = {
  getAccessToken: () => cachedAccess,
  getRefreshToken: () => cachedRefresh,
  async setTokens(tokens: TokenPair) {
    cachedAccess = tokens.access_token;
    cachedRefresh = tokens.refresh_token;
    await SecureStore.setItemAsync(ACCESS_KEY, tokens.access_token);
    await SecureStore.setItemAsync(REFRESH_KEY, tokens.refresh_token);
  },
  async clearTokens() {
    cachedAccess = null;
    cachedRefresh = null;
    await SecureStore.deleteItemAsync(ACCESS_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
  },
};

export const api = createWealthStackApi({
  baseUrl: apiBaseUrl,
  storage: syncStorage,
});

export async function persistTokens(tokens: TokenPair): Promise<void> {
  await syncStorage.setTokens(tokens);
}

export async function clearAuthTokens(): Promise<void> {
  await syncStorage.clearTokens();
}

export function isAuthenticatedSync(): boolean {
  return !!cachedAccess;
}
