package finance

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/wealth-stack/backend/internal/store"
)

type Scheduler struct {
	db *store.DB
}

func NewScheduler(db *store.DB) *Scheduler {
	return &Scheduler{db: db}
}

type ProcessResult struct {
	Processed int `json:"processed"`
	Skipped   int `json:"skipped"`
	Errors    int `json:"errors"`
}

// ProcessDue generates transactions for all recurring rules due at or before `asOf`.
func (sch *Scheduler) ProcessDue(ctx context.Context, asOf time.Time) (ProcessResult, error) {
	var result ProcessResult
	for {
		due, err := sch.db.ListDueRecurringTransactions(ctx, asOf)
		if err != nil {
			return result, err
		}
		if len(due) == 0 {
			break
		}
		progress := false
		for _, rt := range due {
			ok, err := sch.processOne(ctx, rt, asOf)
			if err != nil {
				result.Errors++
				continue
			}
			if ok {
				result.Processed++
				progress = true
			} else {
				result.Skipped++
			}
		}
		if !progress {
			break
		}
	}
	return result, nil
}

func (sch *Scheduler) processOne(ctx context.Context, rt store.RecurringTransaction, asOf time.Time) (bool, error) {
	scheduledFor := rt.NextExecutionAt
	if scheduledFor.After(asOf) {
		return false, nil
	}
	key := IdempotencyKey(rt.ID.String(), scheduledFor)
	err := sch.db.WithTx(ctx, func(q *store.Queries) error {
		exec, err := q.ClaimRecurringExecution(ctx, store.ClaimRecurringExecutionParams{
			RecurringTransactionID: rt.ID,
			IdempotencyKey:         key,
			ScheduledFor:           scheduledFor,
		})
		if errors.Is(err, pgx.ErrNoRows) {
			existing, gerr := q.GetRecurringExecutionByKey(ctx, store.GetRecurringExecutionByKeyParams{
				RecurringTransactionID: rt.ID,
				IdempotencyKey:         key,
			})
			if gerr != nil {
				return gerr
			}
			if existing.TransactionID != nil {
				if rt.NextExecutionAt.Equal(scheduledFor) {
					return sch.advanceFrom(ctx, q, rt, scheduledFor)
				}
				return nil
			}
			return sch.finishExecution(ctx, q, rt, existing.ID, scheduledFor)
		}
		if err != nil {
			return err
		}
		return sch.finishExecution(ctx, q, rt, exec.ID, scheduledFor)
	})
	if err != nil {
		return false, err
	}
	return true, nil
}

func (sch *Scheduler) finishExecution(ctx context.Context, q *store.Queries, rt store.RecurringTransaction, execID uuid.UUID, scheduledFor time.Time) error {
	params := store.CreateTransactionParams{
		UserID:          rt.UserID,
		AccountID:       rt.AccountID,
		Amount:          rt.Amount,
		TransactionType: rt.TransactionType,
		OccurredAt:      scheduledFor,
		Note:            rt.Note,
	}
	if rt.CategoryID != nil {
		params.HasCategory = true
		params.CategoryID = *rt.CategoryID
	}
	tx, err := q.CreateTransaction(ctx, params)
	if err != nil {
		return err
	}
	if _, err := q.SetRecurringExecutionTransaction(ctx, store.SetRecurringExecutionTransactionParams{
		ID:            execID,
		TransactionID: tx.ID,
	}); err != nil {
		return err
	}
	return sch.advanceFrom(ctx, q, rt, scheduledFor)
}

func (sch *Scheduler) advanceFrom(ctx context.Context, q *store.Queries, rt store.RecurringTransaction, last time.Time) error {
	schedule := recurringToSchedule(rt)
	next, err := NextExecutionAfter(schedule, last)
	if err != nil {
		return err
	}
	if rt.EndDate != nil {
		end := time.Date(rt.EndDate.Year(), rt.EndDate.Month(), rt.EndDate.Day(), 23, 59, 59, 0, time.UTC)
		if next.After(end) {
			_, err := q.SoftDeleteRecurringTransaction(ctx, store.SoftDeleteRecurringTransactionParams{
				ID:     rt.ID,
				UserID: rt.UserID,
			})
			return err
		}
	}
	_, err = q.AdvanceRecurringNextExecution(ctx, store.AdvanceRecurringNextExecutionParams{
		ID:              rt.ID,
		NextExecutionAt: next,
	})
	return err
}
