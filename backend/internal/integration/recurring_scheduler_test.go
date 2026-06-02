//go:build integration

package integration

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/shopspring/decimal"
	"github.com/wealth-stack/backend/internal/auth"
	"github.com/wealth-stack/backend/internal/finance"
	"github.com/wealth-stack/backend/internal/store"
)

func TestSchedulerIdempotent(t *testing.T) {
	connStr, cleanup := setupPostgres(t)
	defer cleanup()

	ctx := context.Background()
	db, err := store.NewDB(ctx, connStr)
	if err != nil {
		t.Fatalf("db: %v", err)
	}
	defer db.Close()

	email := "recurring-" + uuid.NewString() + "@example.com"
	hash, err := auth.HashPassword("password123")
	if err != nil {
		t.Fatal(err)
	}
	user, err := db.CreateUser(ctx, store.CreateUserParams{Email: email, PasswordHash: hash})
	if err != nil {
		t.Fatal(err)
	}
	account, err := db.CreateAccount(ctx, store.CreateAccountParams{
		UserID: user.ID, Name: "Checking", Currency: "USD", AccountType: "cash",
	})
	if err != nil {
		t.Fatal(err)
	}

	dom := int16(1)
	dueAt := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)
	_, err = db.CreateRecurringTransaction(ctx, store.CreateRecurringTransactionParams{
		UserID:          user.ID,
		AccountID:       account.ID,
		Amount:          decimal.RequireFromString("99.00"),
		TransactionType: "expense",
		Label:           strPtr("Rent"),
		Frequency:       "monthly",
		HasDayOfMonth:   true,
		DayOfMonth:      pgtype.Int2{Int16: dom, Valid: true},
		Timezone:        "UTC",
		StartDate:       dueAt,
		NextExecutionAt: dueAt,
	})
	if err != nil {
		t.Fatal(err)
	}

	sch := finance.NewScheduler(db)
	asOf := time.Date(2024, 1, 2, 0, 0, 0, 0, time.UTC)
	res1, err := sch.ProcessDue(ctx, asOf)
	if err != nil {
		t.Fatal(err)
	}
	if res1.Processed != 1 {
		t.Fatalf("first run processed=%d", res1.Processed)
	}

	res2, err := sch.ProcessDue(ctx, asOf)
	if err != nil {
		t.Fatal(err)
	}
	if res2.Processed != 0 {
		t.Fatalf("second run processed=%d want 0", res2.Processed)
	}

	txs, err := db.ListTransactionsByUser(ctx, user.ID)
	if err != nil {
		t.Fatal(err)
	}
	if len(txs) != 1 {
		t.Fatalf("transactions=%d want 1", len(txs))
	}
}

func strPtr(s string) *string { return &s }
