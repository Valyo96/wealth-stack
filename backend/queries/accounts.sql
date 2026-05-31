-- name: CreateAccount :one
INSERT INTO accounts (user_id, name, currency, account_type)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: ListAccountsByUser :many
SELECT * FROM accounts
WHERE user_id = $1
ORDER BY created_at DESC;

-- name: GetAccountByID :one
SELECT * FROM accounts
WHERE id = $1 AND user_id = $2;
