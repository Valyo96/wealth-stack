import { create } from "zustand";
import {
  api,
  clearAuthTokens,
  hydrateTokenCache,
  isAuthenticatedSync,
  persistTokens,
} from "../api";

interface AuthState {
  ready: boolean;
  loggedIn: boolean;
  hydrate: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  ready: false,
  loggedIn: false,

  async hydrate() {
    await hydrateTokenCache();
    set({ ready: true, loggedIn: isAuthenticatedSync() });
  },

  async login(email, password) {
    const tokens = await api.login(email, password);
    await persistTokens(tokens);
    set({ loggedIn: true });
  },

  async register(email, password) {
    const tokens = await api.register(email, password);
    await persistTokens(tokens);
    set({ loggedIn: true });
  },

  async logout() {
    await clearAuthTokens();
    set({ loggedIn: false });
  },
}));
