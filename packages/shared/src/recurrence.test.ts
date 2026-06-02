import { previewRecurrenceDates, recurrenceScheduleFields } from "./recurrence.js";

describe("previewRecurrenceDates", () => {
  it("returns monthly dates from start_date", () => {
    const dates = previewRecurrenceDates({
      startDate: "2026-06-01",
      frequency: "monthly",
      count: 3,
      from: new Date("2026-06-01T00:00:00.000Z"),
    });
    expect(dates).toEqual(["2026-06-01", "2026-07-01", "2026-08-01"]);
  });

  it("skips past occurrences before from", () => {
    const dates = previewRecurrenceDates({
      startDate: "2026-01-01",
      frequency: "weekly",
      count: 2,
      from: new Date("2026-06-01T12:00:00.000Z"),
    });
    expect(dates).toHaveLength(2);
    expect(dates[0]).toBe("2026-06-04");
    expect(dates[1]).toBe("2026-06-11");
  });

  it("handles month-end for monthly frequency", () => {
    const dates = previewRecurrenceDates({
      startDate: "2026-01-31",
      frequency: "monthly",
      count: 2,
      from: new Date("2026-01-31T00:00:00.000Z"),
    });
    expect(dates).toEqual(["2026-01-31", "2026-02-28"]);
  });

  it("derives day_of_month for monthly", () => {
    expect(recurrenceScheduleFields("2026-06-15", "monthly")).toEqual({
      day_of_month: 15,
    });
  });

  it("derives day_of_week for weekly (Sunday=0)", () => {
    // 2026-06-01 is Monday in UTC
    expect(recurrenceScheduleFields("2026-06-01", "weekly")).toEqual({
      day_of_week: 1,
    });
  });

  it("returns empty for daily", () => {
    expect(recurrenceScheduleFields("2026-06-01", "daily")).toEqual({});
  });

  it("returns empty when count is zero", () => {
    expect(
      previewRecurrenceDates({
        startDate: "2026-06-01",
        frequency: "daily",
        count: 0,
      }),
    ).toEqual([]);
  });
});
