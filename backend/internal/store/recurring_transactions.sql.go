package store

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/shopspring/decimal"
)

type CreateRecurringTransactionParams struct {
	UserID          uuid.UUID
	AccountID       uuid.UUID
	CategoryID      uuid.UUID
	HasCategory     bool
	Amount          decimal.Decimal
	TransactionType string
	Note            *string
	Label           *string
	Frequency       string
	DayOfWeek       pgtype.Int2
	HasDayOfWeek    bool
	DayOfMonth      pgtype.Int2
	HasDayOfMonth   bool
	Timezone        string
	StartDate       time.Time
	EndDate         pgtype.Date
	HasEndDate      bool
	NextExecutionAt time.Time
}

type GetRecurringTransactionByIDParams struct {
	ID     uuid.UUID
	UserID uuid.UUID
}

type ListRecurringTransactionsByUserParams struct {
	UserID         uuid.UUID
	IncludeDeleted bool
}

type UpdateRecurringTransactionParams struct {
	ID              uuid.UUID
	UserID          uuid.UUID
	AccountID       uuid.UUID
	CategoryID      uuid.UUID
	HasCategory     bool
	Amount          decimal.Decimal
	TransactionType string
	Note            *string
	Label           *string
	Frequency       string
	DayOfWeek       pgtype.Int2
	HasDayOfWeek    bool
	DayOfMonth      pgtype.Int2
	HasDayOfMonth   bool
	Timezone        string
	StartDate       time.Time
	EndDate         pgtype.Date
	HasEndDate      bool
	NextExecutionAt time.Time
}

type SoftDeleteRecurringTransactionParams struct {
	ID     uuid.UUID
	UserID uuid.UUID
}

type PauseRecurringTransactionParams struct {
	ID     uuid.UUID
	UserID uuid.UUID
}

type ResumeRecurringTransactionParams struct {
	ID     uuid.UUID
	UserID uuid.UUID
}

type AdvanceRecurringNextExecutionParams struct {
	ID              uuid.UUID
	NextExecutionAt time.Time
}

type ClaimRecurringExecutionParams struct {
	RecurringTransactionID uuid.UUID
	IdempotencyKey         string
	ScheduledFor           time.Time
}

type GetRecurringExecutionByKeyParams struct {
	RecurringTransactionID uuid.UUID
	IdempotencyKey         string
}

type SetRecurringExecutionTransactionParams struct {
	ID            uuid.UUID
	TransactionID uuid.UUID
}

const createRecurringTransaction = `-- name: CreateRecurringTransaction :one
INSERT INTO recurring_transactions (
    user_id, account_id, category_id, amount, transaction_type, note, label,
    frequency, day_of_week, day_of_month, timezone, start_date, end_date, next_execution_at
) VALUES (
    $1, $2, $3, $4, $5, $6, $7,
    $8, $9, $10, $11, $12, $13, $14
)
RETURNING id, user_id, account_id, category_id, amount, transaction_type, note, label,
    frequency, day_of_week, day_of_month, timezone, start_date, end_date, next_execution_at,
    paused, paused_at, deleted_at, created_at, updated_at`

func (q *Queries) CreateRecurringTransaction(ctx context.Context, arg CreateRecurringTransactionParams) (RecurringTransaction, error) {
	var catID any
	if arg.HasCategory {
		catID = arg.CategoryID
	}
	var dow any
	if arg.HasDayOfWeek {
		dow = arg.DayOfWeek
	}
	var dom any
	if arg.HasDayOfMonth {
		dom = arg.DayOfMonth
	}
	var endDate any
	if arg.HasEndDate {
		endDate = arg.EndDate
	}
	row := q.db.QueryRow(ctx, createRecurringTransaction,
		arg.UserID, arg.AccountID, catID, arg.Amount, arg.TransactionType, arg.Note, arg.Label,
		arg.Frequency, dow, dom, arg.Timezone, dateOnly(arg.StartDate), endDate, arg.NextExecutionAt,
	)
	return scanRecurringTransaction(row)
}

const getRecurringTransactionByID = `-- name: GetRecurringTransactionByID :one
SELECT id, user_id, account_id, category_id, amount, transaction_type, note, label,
    frequency, day_of_week, day_of_month, timezone, start_date, end_date, next_execution_at,
    paused, paused_at, deleted_at, created_at, updated_at
FROM recurring_transactions
WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`

func (q *Queries) GetRecurringTransactionByID(ctx context.Context, arg GetRecurringTransactionByIDParams) (RecurringTransaction, error) {
	row := q.db.QueryRow(ctx, getRecurringTransactionByID, arg.ID, arg.UserID)
	return scanRecurringTransaction(row)
}

const listRecurringTransactionsByUser = `-- name: ListRecurringTransactionsByUser :many
SELECT id, user_id, account_id, category_id, amount, transaction_type, note, label,
    frequency, day_of_week, day_of_month, timezone, start_date, end_date, next_execution_at,
    paused, paused_at, deleted_at, created_at, updated_at
FROM recurring_transactions
WHERE user_id = $1
  AND ($2::boolean = TRUE OR deleted_at IS NULL)
ORDER BY created_at DESC`

func (q *Queries) ListRecurringTransactionsByUser(ctx context.Context, arg ListRecurringTransactionsByUserParams) ([]RecurringTransaction, error) {
	rows, err := q.db.Query(ctx, listRecurringTransactionsByUser, arg.UserID, arg.IncludeDeleted)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := make([]RecurringTransaction, 0)
	for rows.Next() {
		rt, err := scanRecurringTransactionRow(rows)
		if err != nil {
			return nil, err
		}
		items = append(items, rt)
	}
	return items, rows.Err()
}

const updateRecurringTransaction = `-- name: UpdateRecurringTransaction :one
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
RETURNING id, user_id, account_id, category_id, amount, transaction_type, note, label,
    frequency, day_of_week, day_of_month, timezone, start_date, end_date, next_execution_at,
    paused, paused_at, deleted_at, created_at, updated_at`

func (q *Queries) UpdateRecurringTransaction(ctx context.Context, arg UpdateRecurringTransactionParams) (RecurringTransaction, error) {
	var catID any
	if arg.HasCategory {
		catID = arg.CategoryID
	}
	var dow any
	if arg.HasDayOfWeek {
		dow = arg.DayOfWeek
	}
	var dom any
	if arg.HasDayOfMonth {
		dom = arg.DayOfMonth
	}
	var endDate any
	if arg.HasEndDate {
		endDate = arg.EndDate
	}
	row := q.db.QueryRow(ctx, updateRecurringTransaction,
		arg.ID, arg.UserID, arg.AccountID, catID, arg.Amount, arg.TransactionType, arg.Note, arg.Label,
		arg.Frequency, dow, dom, arg.Timezone, dateOnly(arg.StartDate), endDate, arg.NextExecutionAt,
	)
	return scanRecurringTransaction(row)
}

const softDeleteRecurringTransaction = `-- name: SoftDeleteRecurringTransaction :one
UPDATE recurring_transactions
SET deleted_at = NOW(), updated_at = NOW()
WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
RETURNING id, user_id, account_id, category_id, amount, transaction_type, note, label,
    frequency, day_of_week, day_of_month, timezone, start_date, end_date, next_execution_at,
    paused, paused_at, deleted_at, created_at, updated_at`

func (q *Queries) SoftDeleteRecurringTransaction(ctx context.Context, arg SoftDeleteRecurringTransactionParams) (RecurringTransaction, error) {
	row := q.db.QueryRow(ctx, softDeleteRecurringTransaction, arg.ID, arg.UserID)
	return scanRecurringTransaction(row)
}

const pauseRecurringTransaction = `-- name: PauseRecurringTransaction :one
UPDATE recurring_transactions
SET paused = TRUE, paused_at = NOW(), updated_at = NOW()
WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL AND paused = FALSE
RETURNING id, user_id, account_id, category_id, amount, transaction_type, note, label,
    frequency, day_of_week, day_of_month, timezone, start_date, end_date, next_execution_at,
    paused, paused_at, deleted_at, created_at, updated_at`

func (q *Queries) PauseRecurringTransaction(ctx context.Context, arg PauseRecurringTransactionParams) (RecurringTransaction, error) {
	row := q.db.QueryRow(ctx, pauseRecurringTransaction, arg.ID, arg.UserID)
	return scanRecurringTransaction(row)
}

const resumeRecurringTransaction = `-- name: ResumeRecurringTransaction :one
UPDATE recurring_transactions
SET paused = FALSE, paused_at = NULL, updated_at = NOW()
WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL AND paused = TRUE
RETURNING id, user_id, account_id, category_id, amount, transaction_type, note, label,
    frequency, day_of_week, day_of_month, timezone, start_date, end_date, next_execution_at,
    paused, paused_at, deleted_at, created_at, updated_at`

func (q *Queries) ResumeRecurringTransaction(ctx context.Context, arg ResumeRecurringTransactionParams) (RecurringTransaction, error) {
	row := q.db.QueryRow(ctx, resumeRecurringTransaction, arg.ID, arg.UserID)
	return scanRecurringTransaction(row)
}

const listDueRecurringTransactions = `-- name: ListDueRecurringTransactions :many
SELECT id, user_id, account_id, category_id, amount, transaction_type, note, label,
    frequency, day_of_week, day_of_month, timezone, start_date, end_date, next_execution_at,
    paused, paused_at, deleted_at, created_at, updated_at
FROM recurring_transactions
WHERE deleted_at IS NULL
  AND paused = FALSE
  AND next_execution_at <= $1
ORDER BY next_execution_at ASC`

func (q *Queries) ListDueRecurringTransactions(ctx context.Context, asOf time.Time) ([]RecurringTransaction, error) {
	rows, err := q.db.Query(ctx, listDueRecurringTransactions, asOf)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := make([]RecurringTransaction, 0)
	for rows.Next() {
		rt, err := scanRecurringTransactionRow(rows)
		if err != nil {
			return nil, err
		}
		items = append(items, rt)
	}
	return items, rows.Err()
}

const advanceRecurringNextExecution = `-- name: AdvanceRecurringNextExecution :one
UPDATE recurring_transactions
SET next_execution_at = $2, updated_at = NOW()
WHERE id = $1 AND deleted_at IS NULL
RETURNING id, user_id, account_id, category_id, amount, transaction_type, note, label,
    frequency, day_of_week, day_of_month, timezone, start_date, end_date, next_execution_at,
    paused, paused_at, deleted_at, created_at, updated_at`

func (q *Queries) AdvanceRecurringNextExecution(ctx context.Context, arg AdvanceRecurringNextExecutionParams) (RecurringTransaction, error) {
	row := q.db.QueryRow(ctx, advanceRecurringNextExecution, arg.ID, arg.NextExecutionAt)
	return scanRecurringTransaction(row)
}

const claimRecurringExecution = `-- name: ClaimRecurringExecution :one
INSERT INTO recurring_transaction_executions (
    recurring_transaction_id, idempotency_key, scheduled_for
) VALUES ($1, $2, $3)
ON CONFLICT (recurring_transaction_id, idempotency_key) DO NOTHING
RETURNING id, recurring_transaction_id, idempotency_key, scheduled_for, transaction_id, created_at`

func (q *Queries) ClaimRecurringExecution(ctx context.Context, arg ClaimRecurringExecutionParams) (RecurringTransactionExecution, error) {
	row := q.db.QueryRow(ctx, claimRecurringExecution, arg.RecurringTransactionID, arg.IdempotencyKey, arg.ScheduledFor)
	return scanRecurringExecution(row)
}

const getRecurringExecutionByKey = `-- name: GetRecurringExecutionByKey :one
SELECT id, recurring_transaction_id, idempotency_key, scheduled_for, transaction_id, created_at
FROM recurring_transaction_executions
WHERE recurring_transaction_id = $1 AND idempotency_key = $2`

func (q *Queries) GetRecurringExecutionByKey(ctx context.Context, arg GetRecurringExecutionByKeyParams) (RecurringTransactionExecution, error) {
	row := q.db.QueryRow(ctx, getRecurringExecutionByKey, arg.RecurringTransactionID, arg.IdempotencyKey)
	return scanRecurringExecution(row)
}

const setRecurringExecutionTransaction = `-- name: SetRecurringExecutionTransaction :one
UPDATE recurring_transaction_executions
SET transaction_id = $2
WHERE id = $1
RETURNING id, recurring_transaction_id, idempotency_key, scheduled_for, transaction_id, created_at`

func (q *Queries) SetRecurringExecutionTransaction(ctx context.Context, arg SetRecurringExecutionTransactionParams) (RecurringTransactionExecution, error) {
	row := q.db.QueryRow(ctx, setRecurringExecutionTransaction, arg.ID, arg.TransactionID)
	return scanRecurringExecution(row)
}

func dateOnly(t time.Time) time.Time {
	return time.Date(t.Year(), t.Month(), t.Day(), 0, 0, 0, 0, time.UTC)
}

func scanRecurringTransaction(row scannable) (RecurringTransaction, error) {
	return scanRecurringTransactionRow(row)
}

func scanRecurringTransactionRow(row scannable) (RecurringTransaction, error) {
	var rt RecurringTransaction
	var cat pgtype.UUID
	var dow, dom pgtype.Int2
	var endDate pgtype.Date
	var note, label pgtype.Text
	var pausedAt, deletedAt pgtype.Timestamptz
	err := row.Scan(
		&rt.ID, &rt.UserID, &rt.AccountID, &cat, &rt.Amount, &rt.TransactionType, &note, &label,
		&rt.Frequency, &dow, &dom, &rt.Timezone, &rt.StartDate, &endDate, &rt.NextExecutionAt,
		&rt.Paused, &pausedAt, &deletedAt, &rt.CreatedAt, &rt.UpdatedAt,
	)
	if err != nil {
		return rt, err
	}
	if cat.Valid {
		id := uuid.UUID(cat.Bytes)
		rt.CategoryID = &id
	}
	if note.Valid {
		rt.Note = &note.String
	}
	if label.Valid {
		rt.Label = &label.String
	}
	if dow.Valid {
		v := dow.Int16
		rt.DayOfWeek = &v
	}
	if dom.Valid {
		v := dom.Int16
		rt.DayOfMonth = &v
	}
	if endDate.Valid {
		t := endDate.Time
		rt.EndDate = &t
	}
	if pausedAt.Valid {
		rt.PausedAt = &pausedAt.Time
	}
	if deletedAt.Valid {
		rt.DeletedAt = &deletedAt.Time
	}
	rt.StartDate = dateOnly(rt.StartDate)
	if rt.EndDate != nil {
		d := dateOnly(*rt.EndDate)
		rt.EndDate = &d
	}
	return rt, nil
}

func scanRecurringExecution(row scannable) (RecurringTransactionExecution, error) {
	var ex RecurringTransactionExecution
	var txID pgtype.UUID
	err := row.Scan(&ex.ID, &ex.RecurringTransactionID, &ex.IdempotencyKey, &ex.ScheduledFor, &txID, &ex.CreatedAt)
	if err != nil {
		return ex, err
	}
	if txID.Valid {
		id := uuid.UUID(txID.Bytes)
		ex.TransactionID = &id
	}
	return ex, nil
}
