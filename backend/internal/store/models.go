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
