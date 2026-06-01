import { formatMoney } from "./format";

describe("formatMoney", () => {
  it("formats numeric strings as currency", () => {
    const result = formatMoney("1234.5");
    expect(result).toMatch(/1,234\.50|1.234,50/);
  });

  it("returns original value when not a number", () => {
    expect(formatMoney("n/a")).toBe("n/a");
  });
});
