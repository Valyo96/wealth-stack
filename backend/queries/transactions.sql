-- name: CreateTransaction :one
INSERT INTO transactions (
    user_id, account_id, category_id, amount, transaction_type, occurred_at, note
) VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;

-- name: ListTransactionsByUser :many
SELECT * FROM transactions
WHERE user_id = $1
ORDER BY occurred_at DESC;

-- name: GetTransactionByID :one
SELECT * FROM transactions
WHERE id = $1 AND user_id = $2;
