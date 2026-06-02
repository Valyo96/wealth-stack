export function validateRecurringAmount(amount: string): string | null {
  const trimmed = amount.trim();
  if (!trimmed) return "Amount is required";
  const n = Number(trimmed);
  if (Number.isNaN(n) || n <= 0) return "Enter a positive amount";
  return null;
}

export function validateRecurringStartDate(startDate: string): string | null {
  if (!startDate.trim()) return "Start date is required";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
    return "Use YYYY-MM-DD format";
  }
  const [y, m, d] = startDate.split("-").map(Number);
  const parsed = new Date(Date.UTC(y!, m! - 1, d!));
  if (
    parsed.getUTCFullYear() !== y ||
    parsed.getUTCMonth() !== m! - 1 ||
    parsed.getUTCDate() !== d!
  ) {
    return "Invalid date";
  }
  return null;
}

export function validateRecurringAccountId(accountId: string | undefined): string | null {
  if (!accountId) return "Select an account";
  return null;
}
