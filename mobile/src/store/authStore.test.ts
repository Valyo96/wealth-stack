import { useAuthStore } from "./authStore";

const mockLogin = jest.fn();
const mockRegister = jest.fn();
const mockHydrateTokenCache = jest.fn();
const mockPersistTokens = jest.fn();
const mockClearAuthTokens = jest.fn();
const mockIsAuthenticatedSync = jest.fn();

jest.mock("../api", () => ({
  api: {
    login: (...args: unknown[]) => mockLogin(...args),
    register: (...args: unknown[]) => mockRegister(...args),
  },
  hydrateTokenCache: () => mockHydrateTokenCache(),
  persistTokens: (tokens: unknown) => mockPersistTokens(tokens),
  clearAuthTokens: () => mockClearAuthTokens(),
  isAuthenticatedSync: () => mockIsAuthenticatedSync(),
}));

describe("authStore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({ ready: false, loggedIn: false });
    mockLogin.mockResolvedValue({
      access_token: "a",
      refresh_token: "r",
      expires_in: 900,
    });
    mockRegister.mockResolvedValue({
      access_token: "a",
      refresh_token: "r",
      expires_in: 900,
    });
    mockHydrateTokenCache.mockResolvedValue(undefined);
    mockPersistTokens.mockResolvedValue(undefined);
    mockClearAuthTokens.mockResolvedValue(undefined);
    mockIsAuthenticatedSync.mockReturnValue(false);
  });

  it("hydrates auth state from secure storage", async () => {
    mockIsAuthenticatedSync.mockReturnValue(true);
    await useAuthStore.getState().hydrate();
    expect(mockHydrateTokenCache).toHaveBeenCalled();
    expect(useAuthStore.getState()).toMatchObject({ ready: true, loggedIn: true });
  });

  it("login persists tokens and marks logged in", async () => {
    await useAuthStore.getState().login("user@test.com", "password123");
    expect(mockLogin).toHaveBeenCalledWith("user@test.com", "password123");
    expect(mockPersistTokens).toHaveBeenCalled();
    expect(useAuthStore.getState().loggedIn).toBe(true);
  });

  it("logout clears tokens", async () => {
    useAuthStore.setState({ loggedIn: true });
    await useAuthStore.getState().logout();
    expect(mockClearAuthTokens).toHaveBeenCalled();
    expect(useAuthStore.getState().loggedIn).toBe(false);
  });
});
