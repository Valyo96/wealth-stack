import { screen, waitFor } from "@testing-library/react-native";
import DashboardScreen from "./index";
import { renderWithProviders } from "../../src/test/renderWithProviders";

const mockListAccounts = jest.fn();
const mockDashboardSummary = jest.fn();
const mockCreateAccount = jest.fn();
const mockLogout = jest.fn();

jest.mock("expo-router", () => ({
  router: { replace: jest.fn() },
}));

jest.mock("../../src/store/authStore", () => ({
  useAuthStore: (selector: (s: { logout: () => Promise<void> }) => unknown) =>
    selector({ logout: mockLogout }),
}));

jest.mock("../../src/api", () => ({
  api: {
    listAccounts: (...args: unknown[]) => mockListAccounts(...args),
    dashboardSummary: (...args: unknown[]) => mockDashboardSummary(...args),
    createAccount: (...args: unknown[]) => mockCreateAccount(...args),
  },
}));

describe("DashboardScreen", () => {
  beforeEach(() => {
    mockLogout.mockReset().mockResolvedValue(undefined);
    mockListAccounts.mockReset().mockResolvedValue([
      { id: "a1", name: "Main Wallet", currency: "USD", account_type: "cash" },
    ]);
    mockDashboardSummary.mockReset().mockResolvedValue({
      total_income: "1000",
      total_expenses: "400",
      net: "600",
      period_label: "May 2026",
      period_start: "2026-05-01",
      period_end: "2026-05-31",
    });
    mockCreateAccount.mockReset().mockResolvedValue({
      id: "a1",
      name: "Main Wallet",
      currency: "USD",
      account_type: "cash",
    });
  });

  it("renders dashboard summary and accounts", async () => {
    renderWithProviders(<DashboardScreen />);

    expect(screen.getByText("Dashboard")).toBeTruthy();

    await waitFor(() => {
      expect(mockDashboardSummary).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText("Main Wallet")).toBeTruthy();
      expect(screen.getByText("May 2026")).toBeTruthy();
      expect(screen.getByText("Income")).toBeTruthy();
    });
  });

  it("creates default account when none exist", async () => {
    mockListAccounts
      .mockReset()
      .mockResolvedValueOnce([])
      .mockResolvedValue([
        { id: "new", name: "Main Wallet", currency: "USD", account_type: "cash" },
      ]);

    renderWithProviders(<DashboardScreen />);

    await waitFor(() => {
      expect(mockCreateAccount).toHaveBeenCalledWith("Main Wallet");
    });
  });
});
