import { afterEach, describe, expect, it } from "vitest";
import { clearTokens, isAuthenticated, setTokens } from "./client";

describe("api client auth helpers", () => {
  afterEach(() => {
    clearTokens();
  });

  it("tracks authentication state from stored tokens", () => {
    expect(isAuthenticated()).toBe(false);

    setTokens({
      access_token: "access-token",
      refresh_token: "refresh-token",
      expires_in: 900,
    });

    expect(isAuthenticated()).toBe(true);

    clearTokens();
    expect(isAuthenticated()).toBe(false);
  });
});
