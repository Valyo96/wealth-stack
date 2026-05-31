package store

import (
	"context"

	"github.com/google/uuid"
)

const createAccount = `-- name: CreateAccount :one
INSERT INTO accounts (user_id, name, currency, account_type)
VALUES ($1, $2, $3, $4)
RETURNING id, user_id, name, currency, account_type, created_at`

func (q *Queries) CreateAccount(ctx context.Context, arg CreateAccountParams) (Account, error) {
	row := q.db.QueryRow(ctx, createAccount, arg.UserID, arg.Name, arg.Currency, arg.AccountType)
	var a Account
	err := row.Scan(&a.ID, &a.UserID, &a.Name, &a.Currency, &a.AccountType, &a.CreatedAt)
	return a, err
}

const listAccountsByUser = `-- name: ListAccountsByUser :many
SELECT id, user_id, name, currency, account_type, created_at FROM accounts
WHERE user_id = $1
ORDER BY created_at DESC`

func (q *Queries) ListAccountsByUser(ctx context.Context, userID uuid.UUID) ([]Account, error) {
	rows, err := q.db.Query(ctx, listAccountsByUser, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := make([]Account, 0)
	for rows.Next() {
		var a Account
		if err := rows.Scan(&a.ID, &a.UserID, &a.Name, &a.Currency, &a.AccountType, &a.CreatedAt); err != nil {
			return nil, err
		}
		items = append(items, a)
	}
	return items, rows.Err()
}

const getAccountByID = `-- name: GetAccountByID :one
SELECT id, user_id, name, currency, account_type, created_at FROM accounts
WHERE id = $1 AND user_id = $2`

func (q *Queries) GetAccountByID(ctx context.Context, arg GetAccountByIDParams) (Account, error) {
	row := q.db.QueryRow(ctx, getAccountByID, arg.ID, arg.UserID)
	var a Account
	err := row.Scan(&a.ID, &a.UserID, &a.Name, &a.Currency, &a.AccountType, &a.CreatedAt)
	return a, err
}
