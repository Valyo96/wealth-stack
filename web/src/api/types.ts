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
