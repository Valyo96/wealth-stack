package store

import (
	"context"
)

const dashboardSummary = `-- name: DashboardSummary :one
SELECT
    COALESCE(SUM(CASE WHEN transaction_type = 'income' THEN amount ELSE 0 END), 0)::numeric AS total_income,
    COALESCE(SUM(CASE WHEN transaction_type = 'expense' THEN amount ELSE 0 END), 0)::numeric AS total_expenses
FROM transactions
WHERE user_id = $1
  AND occurred_at >= $2
  AND occurred_at < $3`

func (q *Queries) DashboardSummary(ctx context.Context, arg DashboardSummaryParams) (DashboardSummaryRow, error) {
	row := q.db.QueryRow(ctx, dashboardSummary, arg.UserID, arg.OccurredAt, arg.OccurredAt_2)
	var out DashboardSummaryRow
	err := row.Scan(&out.TotalIncome, &out.TotalExpenses)
	return out, err
}
