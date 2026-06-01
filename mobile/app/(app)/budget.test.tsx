import { screen } from "@testing-library/react-native";
import BudgetOverviewScreen from "./budget";
import { renderWithProviders } from "../../src/test/renderWithProviders";

jest.mock("../../src/api", () => ({
  api: {
    dashboardSummary: jest.fn().mockResolvedValue({
      total_income: "1000",
      total_expenses: "250",
      net: "750",
      period_label: "May 2026",
      period_start: "2026-05-01",
      period_end: "2026-05-31",
    }),
  },
}));

describe("BudgetOverviewScreen", () => {
  it("renders budget summary from dashboard API", async () => {
    renderWithProviders(<BudgetOverviewScreen />);
    expect(await screen.findByText("Budget overview")).toBeTruthy();
    expect(await screen.findByText("May 2026")).toBeTruthy();
    expect(await screen.findByText(/\$750/)).toBeTruthy();
  });
});
