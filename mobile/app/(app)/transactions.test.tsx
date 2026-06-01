import { fireEvent, screen, waitFor } from "@testing-library/react-native";
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
    mockListTransactions.mockReset().mockResolvedValue([
      {
        id: "t1",
        account_id: "a1",
        amount: "42",
        transaction_type: "expense",
        occurred_at: "2026-05-01T12:00:00.000Z",
      },
    ]);
    mockListAccounts.mockReset().mockResolvedValue([
      { id: "a1", name: "Cash", currency: "USD", account_type: "cash" },
    ]);
    mockCreateTransaction.mockReset().mockResolvedValue({
      id: "t2",
      account_id: "a1",
      amount: "10",
      transaction_type: "income",
      occurred_at: "2026-05-02T12:00:00.000Z",
    });
  });

  it("lists transactions", async () => {
    renderWithProviders(<TransactionsScreen />);

    expect(screen.getByText("Transactions")).toBeTruthy();

    await waitFor(() => {
      expect(mockListTransactions).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText("Expense")).toBeTruthy();
      expect(screen.getByText("$42")).toBeTruthy();
    });
  });

  it("validates amount before submit", async () => {
    renderWithProviders(<TransactionsScreen />);

    await waitFor(() => expect(mockListAccounts).toHaveBeenCalled());

    fireEvent.press(screen.getByText("Add"));
    fireEvent.press(screen.getByText("Save"));

    expect(await screen.findByText("Amount is required")).toBeTruthy();
    expect(mockCreateTransaction).not.toHaveBeenCalled();
  });

  it("creates a transaction", async () => {
    renderWithProviders(<TransactionsScreen />);

    await waitFor(() => expect(mockListAccounts).toHaveBeenCalled());

    fireEvent.press(screen.getByText("Add"));
    fireEvent.changeText(screen.getByPlaceholderText("0.00"), "10");
    fireEvent.press(screen.getByText("Save"));

    await waitFor(() => {
      expect(mockCreateTransaction).toHaveBeenCalledWith("a1", "10", "expense");
    });
  });
});
