import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import TransactionsScreen from "./transactions";
import { renderWithProviders } from "../../src/test/renderWithProviders";

const mockListTransactions = jest.fn();
const mockListAccounts = jest.fn();
const mockCreateTransaction = jest.fn();

jest.mock("../../src/api", () => ({
  api: {
    listTransactions: (...args: unknown[]) => mockListTransactions(...args),
    listAccounts: (...args: unknown[]) => mockListAccounts(...args),
    createTransaction: (...args: unknown[]) => mockCreateTransaction(...args),
  },
}));

describe("TransactionsScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockListTransactions.mockResolvedValue([
      {
        id: "t1",
        account_id: "a1",
        amount: "42",
        transaction_type: "expense",
        occurred_at: "2026-05-01",
      },
    ]);
    mockListAccounts.mockResolvedValue([
      { id: "a1", name: "Cash", currency: "USD", account_type: "cash" },
    ]);
    mockCreateTransaction.mockResolvedValue({
      id: "t2",
      account_id: "a1",
      amount: "10",
      transaction_type: "income",
      occurred_at: "2026-05-02",
    });
  });

  it("lists transactions", async () => {
    renderWithProviders(<TransactionsScreen />);
    expect(await screen.findByText("Transactions")).toBeTruthy();
    expect(await screen.findByText("$42")).toBeTruthy();
  });

  it("validates amount before submit", async () => {
    renderWithProviders(<TransactionsScreen />);
    fireEvent.press(await screen.findByText("Add"));
    fireEvent.press(screen.getByText("Save"));

    expect(await screen.findByText("Amount is required")).toBeTruthy();
    expect(mockCreateTransaction).not.toHaveBeenCalled();
  });

  it("creates a transaction", async () => {
    renderWithProviders(<TransactionsScreen />);
    fireEvent.press(await screen.findByText("Add"));
    fireEvent.changeText(screen.getByPlaceholderText("0.00"), "10");
    fireEvent.press(screen.getByText("Save"));

    await waitFor(() => {
      expect(mockCreateTransaction).toHaveBeenCalledWith("a1", "10", "expense");
    });
  });
});
