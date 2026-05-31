import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api, clearTokens, isAuthenticated, setTokens } from "../api/client";

interface AuthContextValue {
  loggedIn: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loggedIn, setLoggedIn] = useState(isAuthenticated);

  const login = useCallback(async (email: string, password: string) => {
    const tokens = await api.login(email, password);
    setTokens(tokens);
    setLoggedIn(true);
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    const tokens = await api.register(email, password);
    setTokens(tokens);
    setLoggedIn(true);
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    setLoggedIn(false);
  }, []);

  const value = useMemo(
    () => ({ loggedIn, login, register, logout }),
    [loggedIn, login, register, logout],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
