export interface ApiError {
  code: string;
  message: string;
}

export interface ApiEnvelope<T> {
  data?: T;
  error?: ApiError;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface Account {
  id: string;
  name: string;
  currency: string;
  account_type: string;
}

export interface Transaction {
  id: string;
  account_id: string;
  amount: string;
  transaction_type: "income" | "expense";
  occurred_at: string;
  note?: string | null;
}

export type RecurrenceFrequency = "daily" | "weekly" | "biweekly" | "monthly";

export interface RecurringTransaction {
  id: string;
  user_id: string;
  account_id: string;
  category_id?: string | null;
  amount: string;
  transaction_type: "income" | "expense";
  note?: string | null;
  label?: string | null;
  frequency: RecurrenceFrequency;
  day_of_week?: number | null;
  day_of_month?: number | null;
  timezone: string;
  start_date: string;
  end_date?: string | null;
  next_execution_at: string;
  paused: boolean;
  paused_at?: string | null;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateRecurringTransactionInput {
  account_id: string;
  category_id?: string;
  amount: string;
  transaction_type: "income" | "expense";
  note?: string;
  label?: string;
  frequency: RecurrenceFrequency;
  day_of_week?: number;
  day_of_month?: number;
  timezone?: string;
  start_date: string;
  end_date?: string;
}

export interface PatchRecurringTransactionInput {
  account_id?: string;
  category_id?: string;
  clear_category?: boolean;
  amount?: string;
  transaction_type?: "income" | "expense";
  note?: string;
  label?: string;
  frequency?: RecurrenceFrequency;
  day_of_week?: number;
  day_of_month?: number;
  timezone?: string;
  start_date?: string;
  end_date?: string;
  clear_end_date?: boolean;
}

export interface UpcomingRecurringOccurrence {
  recurring_transaction_id: string;
  label?: string | null;
  amount: string;
  transaction_type: "income" | "expense";
  scheduled_for: string;
}

export interface DashboardSummary {
  total_income: string;
  total_expenses: string;
  net: string;
  period_label: string;
  period_start: string;
  period_end: string;
}

export class ApiClientError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

export interface TokenStorage {
  getAccessToken(): string | null;
  getRefreshToken(): string | null;
  setTokens(tokens: TokenPair): void | Promise<void>;
  clearTokens(): void | Promise<void>;
}

export interface WealthStackApiConfig {
  baseUrl: string;
  storage: TokenStorage;
  fetchImpl?: typeof fetch;
  /** Abort hung requests (e.g. wrong API host on a physical device). Default 20s. */
  requestTimeoutMs?: number;
}
