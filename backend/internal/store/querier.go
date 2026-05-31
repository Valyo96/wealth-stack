package store

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/shopspring/decimal"
)

type DBTX interface {
	Exec(context.Context, string, ...any) (pgconn.CommandTag, error)
	Query(context.Context, string, ...any) (pgx.Rows, error)
	QueryRow(context.Context, string, ...any) pgx.Row
}

type Queries struct {
	db DBTX
}

func New(db DBTX) *Queries {
	return &Queries{db: db}
}

type CreateUserParams struct {
	Email        string
	PasswordHash string
}

type CreateAccountParams struct {
	UserID      uuid.UUID
	Name        string
	Currency    string
	AccountType string
}

type GetAccountByIDParams struct {
	ID     uuid.UUID
	UserID uuid.UUID
}

type CreateCategoryParams struct {
	UserID       uuid.UUID
	Name         string
	CategoryType string
}

type GetCategoryByIDParams struct {
	ID     uuid.UUID
	UserID uuid.UUID
}

type CreateTransactionParams struct {
	UserID          uuid.UUID
	AccountID       uuid.UUID
	CategoryID      uuid.UUID
	HasCategory     bool
	Amount          decimal.Decimal
	TransactionType string
	OccurredAt      time.Time
	Note            *string
}

type GetTransactionByIDParams struct {
	ID     uuid.UUID
	UserID uuid.UUID
}

type DashboardSummaryParams struct {
	UserID       uuid.UUID
	OccurredAt   time.Time
	OccurredAt_2 time.Time
}

type DashboardSummaryRow struct {
	TotalIncome   decimal.Decimal
	TotalExpenses decimal.Decimal
}
