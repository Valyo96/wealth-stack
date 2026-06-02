import type { RecurrenceFrequency } from "./types.js";

/** Parse YYYY-MM-DD as UTC midnight for stable calendar math. */
function parseDateOnly(isoDate: string): Date {
  const [y, m, d] = isoDate.split("-").map(Number);
  if (!y || !m || !d) {
    throw new Error("Invalid date");
  }
  return new Date(Date.UTC(y, m - 1, d));
}

function formatDateOnly(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function addMonths(date: Date, months: number): Date {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth();
  const d = date.getUTCDate();
  const targetMonth = m + months;
  const lastDay = new Date(Date.UTC(y, targetMonth + 1, 0)).getUTCDate();
  const day = Math.min(d, lastDay);
  return new Date(Date.UTC(y, targetMonth, day));
}

function advanceOnce(date: Date, frequency: RecurrenceFrequency): Date {
  switch (frequency) {
    case "daily":
      return addDays(date, 1);
    case "weekly":
      return addDays(date, 7);
    case "biweekly":
      return addDays(date, 14);
    case "monthly":
      return addMonths(date, 1);
    default: {
      const _exhaustive: never = frequency;
      return _exhaustive;
    }
  }
}

export interface PreviewRecurrenceOptions {
  /** ISO date (YYYY-MM-DD) of the first occurrence. */
  startDate: string;
  frequency: RecurrenceFrequency;
  /** How many upcoming dates to return (default 5). */
  count?: number;
  /** Only include dates on or after this instant (default: now). */
  from?: Date;
}

/**
 * Client-side schedule preview for recurring transactions.
 * Returns up to `count` occurrence dates (YYYY-MM-DD), starting from the first
 * occurrence on or after `from`.
 */
export function previewRecurrenceDates(options: PreviewRecurrenceOptions): string[] {
  const count = options.count ?? 5;
  if (count <= 0) return [];

  const from = options.from ?? new Date();
  const fromDateOnly = formatDateOnly(
    new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate())),
  );

  let cursor = parseDateOnly(options.startDate);
  const fromParsed = parseDateOnly(fromDateOnly);

  while (cursor < fromParsed) {
    cursor = advanceOnce(cursor, options.frequency);
  }

  const dates: string[] = [];
  for (let i = 0; i < count; i++) {
    dates.push(formatDateOnly(cursor));
    cursor = advanceOnce(cursor, options.frequency);
  }
  return dates;
}

export const RECURRENCE_FREQUENCY_LABELS: Record<RecurrenceFrequency, string> = {
  daily: "Daily",
  weekly: "Weekly",
  biweekly: "Every 2 weeks",
  monthly: "Monthly",
};

/** Schedule fields the API expects, derived from start_date (0=Sun .. 6=Sat for weekday). */
export function recurrenceScheduleFields(
  startDate: string,
  frequency: RecurrenceFrequency,
): { day_of_week?: number; day_of_month?: number } {
  const [y, m, d] = startDate.split("-").map(Number);
  if (!y || !m || !d) return {};

  switch (frequency) {
    case "weekly":
    case "biweekly":
      return { day_of_week: new Date(Date.UTC(y, m - 1, d)).getUTCDay() };
    case "monthly":
      return { day_of_month: d };
    default:
      return {};
  }
}
