package finance

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/shopspring/decimal"
	"github.com/wealth-stack/backend/internal/store"
)

var (
	ErrNotFound      = errors.New("resource not found")
	ErrInvalidInput  = errors.New("invalid input")
	ErrForbidden     = errors.New("forbidden")
)

type Service struct {
	queries *store.Queries
}

func NewService(queries *store.Queries) *Service {
	return &Service{queries: queries}
}

type CreateAccountInput struct {
	Name        string `json:"name"`
	Currency    string `json:"currency"`
	AccountType string `json:"account_type"`
}

type CreateTransactionInput struct {
	AccountID       uuid.UUID  `json:"account_id"`
	CategoryID      *uuid.UUID `json:"category_id,omitempty"`
	Amount          string     `json:"amount"`
	TransactionType string     `json:"transaction_type"`
	OccurredAt      time.Time  `json:"occurred_at"`
	Note            *string    `json:"note,omitempty"`
}

type DashboardSummary struct {
	TotalIncome   string `json:"total_income"`
	TotalExpenses string `json:"total_expenses"`
	Net           string `json:"net"`
	PeriodLabel   string `json:"period_label"`
	PeriodStart   string `json:"period_start"`
	PeriodEnd     string `json:"period_end"`
}

func (s *Service) ListAccounts(ctx context.Context, userID uuid.UUID) ([]store.Account, error) {
	return s.queries.ListAccountsByUser(ctx, userID)
}

func (s *Service) CreateAccount(ctx context.Context, userID uuid.UUID, in CreateAccountInput) (store.Account, error) {
	name := trim(in.Name)
	if name == "" {
		return store.Account{}, ErrInvalidInput
	}
	currency := trim(in.Currency)
	if currency == "" {
		currency = "USD"
	}
	accountType := trim(in.AccountType)
	if accountType == "" {
		accountType = "cash"
	}
	return s.queries.CreateAccount(ctx, store.CreateAccountParams{
		UserID:      userID,
		Name:        name,
		Currency:    currency,
		AccountType: accountType,
	})
}

func (s *Service) ListTransactions(ctx context.Context, userID uuid.UUID, from, to *time.Time, accountID *uuid.UUID) ([]store.Transaction, error) {
	txs, err := s.queries.ListTransactionsByUser(ctx, userID)
	if err != nil {
		return nil, err
	}
	if from == nil && to == nil && accountID == nil {
		return txs, nil
	}
	filtered := make([]store.Transaction, 0, len(txs))
	for _, tx := range txs {
		if from != nil && tx.OccurredAt.Before(*from) {
			continue
		}
		if to != nil && tx.OccurredAt.After(*to) {
			continue
		}
		if accountID != nil && tx.AccountID != *accountID {
			continue
		}
		filtered = append(filtered, tx)
	}
	return filtered, nil
}

func (s *Service) CreateTransaction(ctx context.Context, userID uuid.UUID, in CreateTransactionInput) (store.Transaction, error) {
	if in.TransactionType != "income" && in.TransactionType != "expense" {
		return store.Transaction{}, ErrInvalidInput
	}
	amount, err := decimal.NewFromString(in.Amount)
	if err != nil || amount.LessThanOrEqual(decimal.Zero) {
		return store.Transaction{}, ErrInvalidInput
	}
	if _, err := s.queries.GetAccountByID(ctx, store.GetAccountByIDParams{
		ID:     in.AccountID,
		UserID: userID,
	}); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return store.Transaction{}, ErrNotFound
		}
		return store.Transaction{}, err
	}
	if in.CategoryID != nil {
		if _, err := s.queries.GetCategoryByID(ctx, store.GetCategoryByIDParams{
			ID:     *in.CategoryID,
			UserID: userID,
		}); err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return store.Transaction{}, ErrNotFound
			}
			return store.Transaction{}, err
		}
	}
	params := store.CreateTransactionParams{
		UserID:          userID,
		AccountID:       in.AccountID,
		HasCategory:     in.CategoryID != nil,
		Amount:          amount,
		TransactionType: in.TransactionType,
		OccurredAt:      in.OccurredAt,
		Note:            in.Note,
	}
	if in.CategoryID != nil {
		params.CategoryID = *in.CategoryID
	}
	return s.queries.CreateTransaction(ctx, params)
}

func (s *Service) DashboardSummary(ctx context.Context, userID uuid.UUID, from, to time.Time, label string) (DashboardSummary, error) {
	row, err := s.queries.DashboardSummary(ctx, store.DashboardSummaryParams{
		UserID:     userID,
		OccurredAt: from,
		OccurredAt_2: to,
	})
	if err != nil {
		return DashboardSummary{}, err
	}
	income := row.TotalIncome
	expenses := row.TotalExpenses
	net := income.Sub(expenses)
	return DashboardSummary{
		TotalIncome:   income.StringFixed(2),
		TotalExpenses: expenses.StringFixed(2),
		Net:           net.StringFixed(2),
		PeriodLabel:   label,
		PeriodStart:   from.Format(time.RFC3339),
		PeriodEnd:     to.Format(time.RFC3339),
	}, nil
}

func CurrentMonthRange(now time.Time) (from, to time.Time, label string) {
	loc := now.Location()
	from = time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, loc)
	to = from.AddDate(0, 1, 0)
	label = from.Format("January 2006")
	return from, to, label
}

func trim(s string) string {
	for len(s) > 0 && (s[0] == ' ' || s[0] == '\t') {
		s = s[1:]
	}
	for len(s) > 0 && (s[len(s)-1] == ' ' || s[len(s)-1] == '\t') {
		s = s[:len(s)-1]
	}
	return s
}
