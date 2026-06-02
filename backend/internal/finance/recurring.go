package finance

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/shopspring/decimal"
	"github.com/wealth-stack/backend/internal/store"
)

type CreateRecurringInput struct {
	AccountID       uuid.UUID  `json:"account_id"`
	CategoryID      *uuid.UUID `json:"category_id,omitempty"`
	Amount          string     `json:"amount"`
	TransactionType string     `json:"transaction_type"`
	Note            *string    `json:"note,omitempty"`
	Label           *string    `json:"label,omitempty"`
	Frequency       string     `json:"frequency"`
	DayOfWeek       *int16     `json:"day_of_week,omitempty"`
	DayOfMonth      *int16     `json:"day_of_month,omitempty"`
	Timezone        string     `json:"timezone"`
	StartDate       string     `json:"start_date"` // YYYY-MM-DD
	EndDate         *string    `json:"end_date,omitempty"`
}

type PatchRecurringInput struct {
	AccountID       *uuid.UUID `json:"account_id,omitempty"`
	CategoryID      *uuid.UUID `json:"category_id,omitempty"`
	ClearCategory   bool       `json:"clear_category,omitempty"`
	Amount          *string    `json:"amount,omitempty"`
	TransactionType *string    `json:"transaction_type,omitempty"`
	Note            *string    `json:"note,omitempty"`
	Label           *string    `json:"label,omitempty"`
	Frequency       *string    `json:"frequency,omitempty"`
	DayOfWeek       *int16     `json:"day_of_week,omitempty"`
	DayOfMonth      *int16     `json:"day_of_month,omitempty"`
	Timezone        *string    `json:"timezone,omitempty"`
	StartDate       *string    `json:"start_date,omitempty"`
	EndDate         *string    `json:"end_date,omitempty"`
	ClearEndDate    bool       `json:"clear_end_date,omitempty"`
}

type UpcomingOccurrence struct {
	RecurringTransactionID uuid.UUID `json:"recurring_transaction_id"`
	Label                  *string   `json:"label,omitempty"`
	Amount                 string    `json:"amount"`
	TransactionType        string    `json:"transaction_type"`
	ScheduledFor           string    `json:"scheduled_for"`
}

func (s *Service) ListRecurring(ctx context.Context, userID uuid.UUID, includeDeleted bool) ([]store.RecurringTransaction, error) {
	return s.queries.ListRecurringTransactionsByUser(ctx, store.ListRecurringTransactionsByUserParams{
		UserID:         userID,
		IncludeDeleted: includeDeleted,
	})
}

func (s *Service) GetRecurring(ctx context.Context, userID, id uuid.UUID) (store.RecurringTransaction, error) {
	rt, err := s.queries.GetRecurringTransactionByID(ctx, store.GetRecurringTransactionByIDParams{ID: id, UserID: userID})
	if errors.Is(err, pgx.ErrNoRows) {
		return store.RecurringTransaction{}, ErrNotFound
	}
	return rt, err
}

func (s *Service) CreateRecurring(ctx context.Context, userID uuid.UUID, in CreateRecurringInput, now time.Time) (store.RecurringTransaction, error) {
	merged, schedule, err := s.validateAndBuildRecurring(ctx, userID, in, nil)
	if err != nil {
		return store.RecurringTransaction{}, err
	}
	next, err := FirstExecutionAt(schedule, now)
	if err != nil {
		return store.RecurringTransaction{}, err
	}
	merged.NextExecutionAt = next
	return s.queries.CreateRecurringTransaction(ctx, merged)
}

func (s *Service) PatchRecurring(ctx context.Context, userID, id uuid.UUID, patch PatchRecurringInput, now time.Time) (store.RecurringTransaction, error) {
	current, err := s.GetRecurring(ctx, userID, id)
	if err != nil {
		return store.RecurringTransaction{}, err
	}
	updated, schedule, err := s.applyPatch(ctx, userID, current, patch)
	if err != nil {
		return store.RecurringTransaction{}, err
	}
	if patch.AffectsSchedule() {
		next, err := FirstExecutionAt(schedule, now)
		if err != nil {
			return store.RecurringTransaction{}, err
		}
		updated.NextExecutionAt = next
	}
	return s.queries.UpdateRecurringTransaction(ctx, updated)
}

func (s *Service) SoftDeleteRecurring(ctx context.Context, userID, id uuid.UUID) (store.RecurringTransaction, error) {
	rt, err := s.queries.SoftDeleteRecurringTransaction(ctx, store.SoftDeleteRecurringTransactionParams{ID: id, UserID: userID})
	if errors.Is(err, pgx.ErrNoRows) {
		return store.RecurringTransaction{}, ErrNotFound
	}
	return rt, err
}

func (s *Service) PauseRecurring(ctx context.Context, userID, id uuid.UUID) (store.RecurringTransaction, error) {
	rt, err := s.queries.PauseRecurringTransaction(ctx, store.PauseRecurringTransactionParams{ID: id, UserID: userID})
	if errors.Is(err, pgx.ErrNoRows) {
		return store.RecurringTransaction{}, ErrNotFound
	}
	return rt, err
}

func (s *Service) ResumeRecurring(ctx context.Context, userID, id uuid.UUID, now time.Time) (store.RecurringTransaction, error) {
	rt, err := s.queries.ResumeRecurringTransaction(ctx, store.ResumeRecurringTransactionParams{ID: id, UserID: userID})
	if errors.Is(err, pgx.ErrNoRows) {
		return store.RecurringTransaction{}, ErrNotFound
	}
	schedule := recurringToSchedule(rt)
	next, err := FirstExecutionAt(schedule, now)
	if err != nil {
		return store.RecurringTransaction{}, err
	}
	_, err = s.queries.AdvanceRecurringNextExecution(ctx, store.AdvanceRecurringNextExecutionParams{
		ID:              rt.ID,
		NextExecutionAt: next,
	})
	if err != nil {
		return store.RecurringTransaction{}, err
	}
	rt.NextExecutionAt = next
	return rt, nil
}

func (s *Service) UpcomingRecurring(ctx context.Context, userID uuid.UUID, from time.Time, limit int) ([]UpcomingOccurrence, error) {
	items, err := s.ListRecurring(ctx, userID, false)
	if err != nil {
		return nil, err
	}
	out := make([]UpcomingOccurrence, 0)
	for _, rt := range items {
		if rt.Paused {
			continue
		}
		schedule := recurringToSchedule(rt)
		preview, err := PreviewOccurrences(schedule, from, limit)
		if err != nil {
			return nil, err
		}
		for _, when := range preview {
			out = append(out, UpcomingOccurrence{
				RecurringTransactionID: rt.ID,
				Label:                  rt.Label,
				Amount:                 rt.Amount.StringFixed(2),
				TransactionType:        rt.TransactionType,
				ScheduledFor:           when.Format(time.RFC3339),
			})
			if len(out) >= limit {
				return out, nil
			}
		}
	}
	return out, nil
}

func (p PatchRecurringInput) AffectsSchedule() bool {
	return p.Frequency != nil || p.DayOfWeek != nil || p.DayOfMonth != nil ||
		p.Timezone != nil || p.StartDate != nil || p.EndDate != nil || p.ClearEndDate
}

func recurringToSchedule(rt store.RecurringTransaction) Schedule {
	return RecurringToSchedule(rt.Frequency, rt.DayOfWeek, rt.DayOfMonth, rt.Timezone, rt.StartDate, rt.EndDate)
}

func (s *Service) validateAndBuildRecurring(ctx context.Context, userID uuid.UUID, in CreateRecurringInput, _ *store.RecurringTransaction) (store.CreateRecurringTransactionParams, Schedule, error) {
	if in.TransactionType != "income" && in.TransactionType != "expense" {
		return store.CreateRecurringTransactionParams{}, Schedule{}, ErrInvalidInput
	}
	amount, err := decimal.NewFromString(in.Amount)
	if err != nil || amount.LessThanOrEqual(decimal.Zero) {
		return store.CreateRecurringTransactionParams{}, Schedule{}, ErrInvalidInput
	}
	if _, err := s.queries.GetAccountByID(ctx, store.GetAccountByIDParams{ID: in.AccountID, UserID: userID}); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return store.CreateRecurringTransactionParams{}, Schedule{}, ErrNotFound
		}
		return store.CreateRecurringTransactionParams{}, Schedule{}, err
	}
	if in.CategoryID != nil {
		if _, err := s.queries.GetCategoryByID(ctx, store.GetCategoryByIDParams{ID: *in.CategoryID, UserID: userID}); err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return store.CreateRecurringTransactionParams{}, Schedule{}, ErrNotFound
			}
			return store.CreateRecurringTransactionParams{}, Schedule{}, err
		}
	}
	start, err := parseDate(in.StartDate)
	if err != nil {
		return store.CreateRecurringTransactionParams{}, Schedule{}, ErrInvalidInput
	}
	var end *time.Time
	if in.EndDate != nil {
		e, err := parseDate(*in.EndDate)
		if err != nil {
			return store.CreateRecurringTransactionParams{}, Schedule{}, ErrInvalidInput
		}
		end = &e
	}
	tz := trim(in.Timezone)
	if tz == "" {
		tz = "UTC"
	}
	dow, dom := normalizeScheduleFields(in.Frequency, start, in.DayOfWeek, in.DayOfMonth)
	schedule := RecurringToSchedule(in.Frequency, dow, dom, tz, start, end)
	if err := ValidateSchedule(schedule); err != nil {
		return store.CreateRecurringTransactionParams{}, Schedule{}, ErrInvalidInput
	}
	params := store.CreateRecurringTransactionParams{
		UserID:          userID,
		AccountID:       in.AccountID,
		Amount:          amount,
		TransactionType: in.TransactionType,
		Note:            in.Note,
		Label:           in.Label,
		Frequency:       in.Frequency,
		Timezone:        tz,
		StartDate:       start,
	}
	if in.CategoryID != nil {
		params.HasCategory = true
		params.CategoryID = *in.CategoryID
	}
	if dow != nil {
		params.HasDayOfWeek = true
		params.DayOfWeek = pgInt2(*dow)
	}
	if dom != nil {
		params.HasDayOfMonth = true
		params.DayOfMonth = pgInt2(*dom)
	}
	if end != nil {
		params.HasEndDate = true
		params.EndDate = pgDate(*end)
	}
	return params, schedule, nil
}

func (s *Service) applyPatch(ctx context.Context, userID uuid.UUID, cur store.RecurringTransaction, patch PatchRecurringInput) (store.UpdateRecurringTransactionParams, Schedule, error) {
	accountID := cur.AccountID
	if patch.AccountID != nil {
		accountID = *patch.AccountID
		if _, err := s.queries.GetAccountByID(ctx, store.GetAccountByIDParams{ID: accountID, UserID: userID}); err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return store.UpdateRecurringTransactionParams{}, Schedule{}, ErrNotFound
			}
			return store.UpdateRecurringTransactionParams{}, Schedule{}, err
		}
	}
	amount := cur.Amount
	if patch.Amount != nil {
		a, err := decimal.NewFromString(*patch.Amount)
		if err != nil || a.LessThanOrEqual(decimal.Zero) {
			return store.UpdateRecurringTransactionParams{}, Schedule{}, ErrInvalidInput
		}
		amount = a
	}
	txType := cur.TransactionType
	if patch.TransactionType != nil {
		txType = *patch.TransactionType
		if txType != "income" && txType != "expense" {
			return store.UpdateRecurringTransactionParams{}, Schedule{}, ErrInvalidInput
		}
	}
	note := cur.Note
	if patch.Note != nil {
		note = patch.Note
	}
	label := cur.Label
	if patch.Label != nil {
		label = patch.Label
	}
	freq := cur.Frequency
	if patch.Frequency != nil {
		freq = *patch.Frequency
	}
	dow := cur.DayOfWeek
	if patch.DayOfWeek != nil {
		dow = patch.DayOfWeek
	}
	dom := cur.DayOfMonth
	if patch.DayOfMonth != nil {
		dom = patch.DayOfMonth
	}
	tz := cur.Timezone
	if patch.Timezone != nil {
		tz = trim(*patch.Timezone)
	}
	start := cur.StartDate
	if patch.StartDate != nil {
		d, err := parseDate(*patch.StartDate)
		if err != nil {
			return store.UpdateRecurringTransactionParams{}, Schedule{}, ErrInvalidInput
		}
		start = d
	}
	end := cur.EndDate
	if patch.ClearEndDate {
		end = nil
	}
	if patch.EndDate != nil {
		d, err := parseDate(*patch.EndDate)
		if err != nil {
			return store.UpdateRecurringTransactionParams{}, Schedule{}, ErrInvalidInput
		}
		end = &d
	}
	var catID uuid.UUID
	hasCat := cur.CategoryID != nil
	if patch.ClearCategory {
		hasCat = false
	} else if patch.CategoryID != nil {
		if _, err := s.queries.GetCategoryByID(ctx, store.GetCategoryByIDParams{ID: *patch.CategoryID, UserID: userID}); err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return store.UpdateRecurringTransactionParams{}, Schedule{}, ErrNotFound
			}
			return store.UpdateRecurringTransactionParams{}, Schedule{}, err
		}
		hasCat = true
		catID = *patch.CategoryID
	} else if cur.CategoryID != nil {
		catID = *cur.CategoryID
	}
	dow, dom = normalizeScheduleFields(freq, start, dow, dom)
	schedule := RecurringToSchedule(freq, dow, dom, tz, start, end)
	if err := ValidateSchedule(schedule); err != nil {
		return store.UpdateRecurringTransactionParams{}, Schedule{}, ErrInvalidInput
	}
	next := cur.NextExecutionAt
	params := store.UpdateRecurringTransactionParams{
		ID:              cur.ID,
		UserID:          userID,
		AccountID:       accountID,
		Amount:          amount,
		TransactionType: txType,
		Note:            note,
		Label:           label,
		Frequency:       freq,
		Timezone:        tz,
		StartDate:       start,
		NextExecutionAt: next,
	}
	if hasCat {
		params.HasCategory = true
		params.CategoryID = catID
	}
	if dow != nil {
		params.HasDayOfWeek = true
		params.DayOfWeek = pgInt2(*dow)
	}
	if dom != nil {
		params.HasDayOfMonth = true
		params.DayOfMonth = pgInt2(*dom)
	}
	if end != nil {
		params.HasEndDate = true
		params.EndDate = pgDate(*end)
	}
	return params, schedule, nil
}

func parseDate(s string) (time.Time, error) {
	return time.Parse("2006-01-02", s)
}

func pgInt2(v int16) pgtype.Int2 {
	return pgtype.Int2{Int16: v, Valid: true}
}

func pgDate(t time.Time) pgtype.Date {
	y, m, d := t.Date()
	return pgtype.Date{Time: time.Date(y, m, d, 0, 0, 0, 0, time.UTC), Valid: true}
}
