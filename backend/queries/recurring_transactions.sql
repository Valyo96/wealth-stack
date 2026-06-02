-- name: CreateRecurringTransaction :one
INSERT INTO recurring_transactions (
    user_id, account_id, category_id, amount, transaction_type, note, label,
    frequency, day_of_week, day_of_month, timezone, start_date, end_date, next_execution_at
) VALUES (
    $1, $2, $3, $4, $5, $6, $7,
    $8, $9, $10, $11, $12, $13, $14
)
RETURNING *;

-- name: GetRecurringTransactionByID :one
SELECT * FROM recurring_transactions
WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL;

-- name: GetRecurringTransactionByIDIncludeDeleted :one
SELECT * FROM recurring_transactions
WHERE id = $1 AND user_id = $2;

-- name: ListRecurringTransactionsByUser :many
SELECT * FROM recurring_transactions
WHERE user_id = $1
  AND (sqlc.arg(include_deleted)::boolean = TRUE OR deleted_at IS NULL)
ORDER BY created_at DESC;

-- name: UpdateRecurringTransaction :one
UPDATE recurring_transactions
SET
    account_id = $3,
    category_id = $4,
    amount = $5,
    transaction_type = $6,
    note = $7,
    label = $8,
    frequency = $9,
    day_of_week = $10,
    day_of_month = $11,
    timezone = $12,
    start_date = $13,
    end_date = $14,
    next_execution_at = $15,
    updated_at = NOW()
WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
RETURNING *;

-- name: SoftDeleteRecurringTransaction :one
UPDATE recurring_transactions
SET deleted_at = NOW(), updated_at = NOW()
WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
RETURNING *;

-- name: PauseRecurringTransaction :one
UPDATE recurring_transactions
SET paused = TRUE, paused_at = NOW(), updated_at = NOW()
WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL AND paused = FALSE
RETURNING *;

-- name: ResumeRecurringTransaction :one
UPDATE recurring_transactions
SET paused = FALSE, paused_at = NULL, updated_at = NOW()
WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL AND paused = TRUE
RETURNING *;

-- name: ListDueRecurringTransactions :many
SELECT * FROM recurring_transactions
WHERE deleted_at IS NULL
  AND paused = FALSE
  AND next_execution_at <= $1
ORDER BY next_execution_at ASC;

-- name: AdvanceRecurringNextExecution :one
UPDATE recurring_transactions
SET next_execution_at = $2, updated_at = NOW()
WHERE id = $1 AND deleted_at IS NULL
RETURNING *;

-- name: ClaimRecurringExecution :one
INSERT INTO recurring_transaction_executions (
    recurring_transaction_id, idempotency_key, scheduled_for
) VALUES ($1, $2, $3)
ON CONFLICT (recurring_transaction_id, idempotency_key) DO NOTHING
RETURNING *;

-- name: GetRecurringExecutionByKey :one
SELECT * FROM recurring_transaction_executions
WHERE recurring_transaction_id = $1 AND idempotency_key = $2;

-- name: SetRecurringExecutionTransaction :one
UPDATE recurring_transaction_executions
SET transaction_id = $2
WHERE id = $1
RETURNING *;
