import { describe, expect, it } from "vitest";
import {
  validateRecurringAccountId,
  validateRecurringAmount,
  validateRecurringStartDate,
} from "./validation";

describe("recurring form validation", () => {
  it("validates amount", () => {
    expect(validateRecurringAmount("")).toBe("Amount is required");
    expect(validateRecurringAmount("0")).toBe("Enter a positive amount");
    expect(validateRecurringAmount("12.50")).toBeNull();
  });

  it("validates start date", () => {
    expect(validateRecurringStartDate("")).toBe("Start date is required");
    expect(validateRecurringStartDate("06-01-2026")).toBe("Use YYYY-MM-DD format");
    expect(validateRecurringStartDate("2026-06-01")).toBeNull();
  });

  it("validates account", () => {
    expect(validateRecurringAccountId(undefined)).toBe("Select an account");
    expect(validateRecurringAccountId("a1")).toBeNull();
  });
});
