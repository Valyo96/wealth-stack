import { fireEvent, screen, waitFor } from "@testing-library/react-native";

import RecurringScreen from "./recurring";

import { renderWithProviders } from "../../src/test/renderWithProviders";



const mockListRecurring = jest.fn();

const mockListUpcoming = jest.fn();

const mockListAccounts = jest.fn();

const mockCreateRecurring = jest.fn();



jest.mock("../../src/api", () => ({

  api: {

    listRecurringTransactions: (...args: unknown[]) => mockListRecurring(...args),

    upcomingRecurringTransactions: (...args: unknown[]) => mockListUpcoming(...args),

    listAccounts: (...args: unknown[]) => mockListAccounts(...args),

    createRecurringTransaction: (...args: unknown[]) =>

      mockCreateRecurring(...args),

    patchRecurringTransaction: jest.fn(),

    deleteRecurringTransaction: jest.fn(),

    pauseRecurringTransaction: jest.fn(),

    resumeRecurringTransaction: jest.fn(),

  },

}));



describe("RecurringScreen", () => {

  beforeEach(() => {

    mockListRecurring.mockReset().mockResolvedValue([

      {

        id: "r1",

        account_id: "a1",

        amount: "99",

        transaction_type: "expense",

        frequency: "monthly",

        start_date: "2026-06-01",

        paused: false,

      },

    ]);

    mockListUpcoming.mockReset().mockResolvedValue([

      {

        recurring_transaction_id: "r1",

        amount: "99",

        transaction_type: "expense",

        scheduled_for: "2026-06-15T00:00:00.000Z",

      },

    ]);

    mockListAccounts.mockReset().mockResolvedValue([

      { id: "a1", name: "Cash", currency: "USD", account_type: "cash" },

    ]);

    mockCreateRecurring.mockReset().mockResolvedValue({

      id: "r2",

      account_id: "a1",

      amount: "25",

      transaction_type: "expense",

      frequency: "weekly",

      start_date: "2026-06-01",

      paused: false,

    });

  });



  it("lists rules and upcoming", async () => {

    renderWithProviders(<RecurringScreen />);



    expect(screen.getByText("Recurring")).toBeTruthy();



    await waitFor(() => {

      expect(mockListRecurring).toHaveBeenCalled();

      expect(mockListUpcoming).toHaveBeenCalled();

    });



    await waitFor(() => {

      expect(screen.getAllByText("$99").length).toBeGreaterThanOrEqual(1);

      expect(screen.getByText(/starts 2026-06-01/)).toBeTruthy();

    });

  });



  it("validates amount before submit", async () => {

    renderWithProviders(<RecurringScreen />);



    await waitFor(() => expect(mockListAccounts).toHaveBeenCalled());



    fireEvent.press(screen.getByText("Add"));

    fireEvent.press(screen.getByText("Save"));



    expect(await screen.findByText("Amount is required")).toBeTruthy();

    expect(mockCreateRecurring).not.toHaveBeenCalled();

  });



  it("creates a recurring rule", async () => {

    renderWithProviders(<RecurringScreen />);



    await waitFor(() => expect(mockListAccounts).toHaveBeenCalled());



    fireEvent.press(screen.getByText("Add"));

    fireEvent.changeText(screen.getByPlaceholderText("0.00"), "25");

    fireEvent.press(screen.getByText("Save"));



    await waitFor(() => {

      expect(mockCreateRecurring).toHaveBeenCalledWith(

        expect.objectContaining({

          account_id: "a1",

          amount: "25",

          transaction_type: "expense",

          frequency: "monthly",

        }),

      );

    });

  });

});

