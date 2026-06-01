import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { ApiClientError } from "@wealth-stack/shared";
import LoginScreen from "./login";

const mockLogin = jest.fn();
const mockRegister = jest.fn();
const mockReplace = jest.fn();

jest.mock("expo-router", () => ({
  router: { replace: (...args: unknown[]) => mockReplace(...args) },
}));

jest.mock("../../src/store/authStore", () => ({
  useAuthStore: () => ({
    login: mockLogin,
    register: mockRegister,
  }),
}));

jest.mock("../../src/api", () => ({
  apiBaseUrl: "http://api.test",
}));

describe("LoginScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLogin.mockResolvedValue(undefined);
    mockRegister.mockResolvedValue(undefined);
  });

  it("shows validation error for short password", async () => {
    render(<LoginScreen />);
    fireEvent.changeText(screen.getByLabelText("Email"), "user@test.com");
    fireEvent.changeText(screen.getByLabelText("Password"), "short");
    fireEvent.press(screen.getByText("Login"));

    expect(await screen.findByText("Password must be at least 8 characters")).toBeTruthy();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it("logs in and navigates to app", async () => {
    render(<LoginScreen />);
    fireEvent.changeText(screen.getByLabelText("Email"), "user@test.com");
    fireEvent.changeText(screen.getByLabelText("Password"), "password123");
    fireEvent.press(screen.getByText("Login"));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("user@test.com", "password123");
      expect(mockReplace).toHaveBeenCalledWith("/(app)");
    });
  });

  it("shows API error message", async () => {
    mockLogin.mockRejectedValue(new ApiClientError("unauthorized", "Invalid credentials"));
    render(<LoginScreen />);
    fireEvent.changeText(screen.getByLabelText("Email"), "user@test.com");
    fireEvent.changeText(screen.getByLabelText("Password"), "password123");
    fireEvent.press(screen.getByText("Login"));

    expect(await screen.findByText("Invalid credentials")).toBeTruthy();
  });
});
