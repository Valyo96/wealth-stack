-- name: DashboardSummary :one
SELECT
    COALESCE(SUM(CASE WHEN transaction_type = 'income' THEN amount ELSE 0 END), 0)::numeric AS total_income,
    COALESCE(SUM(CASE WHEN transaction_type = 'expense' THEN amount ELSE 0 END), 0)::numeric AS total_expenses
FROM transactions
WHERE user_id = $1
  AND occurred_at >= $2
  AND occurred_at < $3;
