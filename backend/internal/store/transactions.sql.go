package store

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

const createTransaction = `-- name: CreateTransaction :one
INSERT INTO transactions (
    user_id, account_id, category_id, amount, transaction_type, occurred_at, note
) VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING id, user_id, account_id, category_id, amount, transaction_type, occurred_at, note, created_at`

func (q *Queries) CreateTransaction(ctx context.Context, arg CreateTransactionParams) (Transaction, error) {
	var catID any
	if arg.HasCategory {
		catID = arg.CategoryID
	}
	row := q.db.QueryRow(ctx, createTransaction,
		arg.UserID,
		arg.AccountID,
		catID,
		arg.Amount,
		arg.TransactionType,
		arg.OccurredAt,
		arg.Note,
	)
	return scanTransaction(row)
}

const listTransactionsByUser = `-- name: ListTransactionsByUser :many
SELECT id, user_id, account_id, category_id, amount, transaction_type, occurred_at, note, created_at
FROM transactions
WHERE user_id = $1
ORDER BY occurred_at DESC`

func (q *Queries) ListTransactionsByUser(ctx context.Context, userID uuid.UUID) ([]Transaction, error) {
	rows, err := q.db.Query(ctx, listTransactionsByUser, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := make([]Transaction, 0)
	for rows.Next() {
		tx, err := scanTransactionRow(rows)
		if err != nil {
			return nil, err
		}
		items = append(items, tx)
	}
	return items, rows.Err()
}

const getTransactionByID = `-- name: GetTransactionByID :one
SELECT id, user_id, account_id, category_id, amount, transaction_type, occurred_at, note, created_at
FROM transactions
WHERE id = $1 AND user_id = $2`

func (q *Queries) GetTransactionByID(ctx context.Context, arg GetTransactionByIDParams) (Transaction, error) {
	row := q.db.QueryRow(ctx, getTransactionByID, arg.ID, arg.UserID)
	return scanTransaction(row)
}

type scannable interface {
	Scan(dest ...any) error
}

func scanTransaction(row scannable) (Transaction, error) {
	return scanTransactionRow(row)
}

func scanTransactionRow(row scannable) (Transaction, error) {
	var tx Transaction
	var cat pgtype.UUID
	err := row.Scan(
		&tx.ID,
		&tx.UserID,
		&tx.AccountID,
		&cat,
		&tx.Amount,
		&tx.TransactionType,
		&tx.OccurredAt,
		&tx.Note,
		&tx.CreatedAt,
	)
	if err != nil {
		return tx, err
	}
	if cat.Valid {
		id := uuid.UUID(cat.Bytes)
		tx.CategoryID = &id
	}
	return tx, nil
}
