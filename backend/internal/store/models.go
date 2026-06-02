package store

import (
	"time"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

type User struct {
	ID           uuid.UUID `json:"id"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	CreatedAt    time.Time `json:"created_at"`
}

type Account struct {
	ID          uuid.UUID `json:"id"`
	UserID      uuid.UUID `json:"user_id"`
	Name        string    `json:"name"`
	Currency    string    `json:"currency"`
	AccountType string    `json:"account_type"`
	CreatedAt   time.Time `json:"created_at"`
}

type Category struct {
	ID           uuid.UUID `json:"id"`
	UserID       uuid.UUID `json:"user_id"`
	Name         string    `json:"name"`
	CategoryType string    `json:"category_type"`
	CreatedAt    time.Time `json:"created_at"`
}

type Transaction struct {
	ID              uuid.UUID       `json:"id"`
	UserID          uuid.UUID       `json:"user_id"`
	AccountID       uuid.UUID       `json:"account_id"`
	CategoryID      *uuid.UUID      `json:"category_id,omitempty"`
	Amount          decimal.Decimal `json:"amount"`
	TransactionType string          `json:"transaction_type"`
	OccurredAt      time.Time       `json:"occurred_at"`
	Note            *string         `json:"note,omitempty"`
	CreatedAt       time.Time       `json:"created_at"`
}

type RecurringTransaction struct {
	ID              uuid.UUID       `json:"id"`
	UserID          uuid.UUID       `json:"user_id"`
	AccountID       uuid.UUID       `json:"account_id"`
	CategoryID      *uuid.UUID      `json:"category_id,omitempty"`
	Amount          decimal.Decimal `json:"amount"`
	TransactionType string          `json:"transaction_type"`
	Note            *string         `json:"note,omitempty"`
	Label           *string         `json:"label,omitempty"`
	Frequency       string          `json:"frequency"`
	DayOfWeek       *int16          `json:"day_of_week,omitempty"`
	DayOfMonth      *int16          `json:"day_of_month,omitempty"`
	Timezone        string          `json:"timezone"`
	StartDate       time.Time       `json:"start_date"`
	EndDate         *time.Time      `json:"end_date,omitempty"`
	NextExecutionAt time.Time       `json:"next_execution_at"`
	Paused          bool            `json:"paused"`
	PausedAt        *time.Time      `json:"paused_at,omitempty"`
	DeletedAt       *time.Time      `json:"deleted_at,omitempty"`
	CreatedAt       time.Time       `json:"created_at"`
	UpdatedAt       time.Time       `json:"updated_at"`
}

type RecurringTransactionExecution struct {
	ID                     uuid.UUID  `json:"id"`
	RecurringTransactionID uuid.UUID  `json:"recurring_transaction_id"`
	IdempotencyKey         string     `json:"idempotency_key"`
	ScheduledFor           time.Time  `json:"scheduled_for"`
	TransactionID          *uuid.UUID `json:"transaction_id,omitempty"`
	CreatedAt              time.Time  `json:"created_at"`
}
