import {
  previewRecurrenceDates,
  recurrenceScheduleFields,
  RECURRENCE_FREQUENCY_LABELS,
  type RecurrenceFrequency,
  type RecurringTransaction,
  type UpcomingRecurringOccurrence,
} from "@wealth-stack/shared";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { MiniCalendar } from "../components/MiniCalendar";
import { api } from "../api/client";
import type { Account } from "../api/types";
import {
  validateRecurringAccountId,
  validateRecurringAmount,
  validateRecurringStartDate,
} from "../recurring/validation";

const FREQUENCIES = Object.keys(
  RECURRENCE_FREQUENCY_LABELS,
) as RecurrenceFrequency[];

function startDateInputValue(iso: string): string {
  return iso.length >= 10 ? iso.slice(0, 10) : iso;
}

function todayIsoDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type FormMode = "create" | "edit";

interface RecurringFormState {
  accountId: string;
  amount: string;
  type: "income" | "expense";
  frequency: RecurrenceFrequency;
  startDate: string;
  note: string;
}

function defaultFormState(accounts: Account[]): RecurringFormState {
  return {
    accountId: accounts[0]?.id ?? "",
    amount: "",
    type: "expense",
    frequency: "monthly",
    startDate: todayIsoDate(),
    note: "",
  };
}

export function RecurringTransactionsPage() {
  const [rules, setRules] = useState<RecurringTransaction[]>([]);
  const [upcoming, setUpcoming] = useState<UpcomingRecurringOccurrence[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<RecurringFormState>(() => defaultFormState([]));
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const accountNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of accounts) map.set(a.id, a.name);
    return map;
  }, [accounts]);

  const schedulePreview = useMemo(() => {
    const startErr = validateRecurringStartDate(form.startDate);
    if (startErr) return [];
    try {
      return previewRecurrenceDates({
        startDate: form.startDate,
        frequency: form.frequency,
        count: 5,
      });
    } catch {
      return [];
    }
  }, [form.startDate, form.frequency]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [recurring, upcomingList, accts] = await Promise.all([
        api.listRecurringTransactions(),
        api.upcomingRecurringTransactions({ limit: 20 }),
        api.listAccounts(),
      ]);
      setRules(recurring);
      setUpcoming(upcomingList);
      setAccounts(accts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load recurring transactions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setFormMode("create");
    setEditingId(null);
    setForm(defaultFormState(accounts));
    setFormError(null);
    setFormOpen(true);
  }

  function openEdit(rule: RecurringTransaction) {
    setFormMode("edit");
    setEditingId(rule.id);
    setForm({
      accountId: rule.account_id,
      amount: rule.amount,
      type: rule.transaction_type,
      frequency: rule.frequency,
      startDate: startDateInputValue(rule.start_date),
      note: rule.note ?? "",
    });
    setFormError(null);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
    setFormError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const amountErr = validateRecurringAmount(form.amount);
    const dateErr = validateRecurringStartDate(form.startDate);
    const accountErr = validateRecurringAccountId(form.accountId);
    const firstErr = amountErr ?? dateErr ?? accountErr;
    if (firstErr) {
      setFormError(firstErr);
      return;
    }

    setSubmitting(true);
    setFormError(null);
    const schedule = recurrenceScheduleFields(form.startDate, form.frequency);
    const payload = {
      account_id: form.accountId,
      amount: form.amount.trim(),
      transaction_type: form.type,
      frequency: form.frequency,
      start_date: form.startDate,
      note: form.note.trim() || undefined,
      ...schedule,
    };
    try {
      if (formMode === "create") {
        await api.createRecurringTransaction(payload);
      } else if (editingId) {
        await api.patchRecurringTransaction(editingId, payload);
      }
      closeForm();
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePauseResume(rule: RecurringTransaction) {
    setError(null);
    try {
      if (rule.paused) {
        await api.resumeRecurringTransaction(rule.id);
      } else {
        await api.pauseRecurringTransaction(rule.id);
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    try {
      await api.deleteRecurringTransaction(id);
      setConfirmDeleteId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Recurring</h1>
          <p className="muted">Scheduled income and expenses</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          Add recurring
        </button>
      </div>

      {error && <p className="error">{error}</p>}
      {loading && <p className="muted">Loading…</p>}

      {!loading && (
        <>
          <section className="recurring-section">
            <h2 className="section-title">Upcoming</h2>
            {upcoming.length === 0 ? (
              <p className="empty section-empty">No upcoming occurrences.</p>
            ) : (
              <ul className="tx-list">
                {upcoming.map((item) => (
                  <li
                    key={`${item.recurring_transaction_id}-${item.scheduled_for}`}
                    className={`tx-item ${item.transaction_type}`}
                  >
                    <div>
                      <strong>
                        {item.label ??
                          (item.transaction_type === "income" ? "Income" : "Expense")}
                      </strong>
                      <span className="tx-amount">${item.amount}</span>
                    </div>
                    <time className="muted">
                      {new Date(item.scheduled_for).toLocaleString()}
                    </time>
                    <p className="tx-note">
                      {item.transaction_type === "income" ? "Income" : "Expense"}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="recurring-section">
            <h2 className="section-title">Rules</h2>
            {rules.length === 0 ? (
              <p className="empty section-empty">No recurring rules yet.</p>
            ) : (
              <ul className="tx-list">
                {rules.map((rule) => (
                  <li key={rule.id} className={`tx-item ${rule.transaction_type}`}>
                    <div>
                      <strong>
                        {rule.transaction_type === "income" ? "Income" : "Expense"}
                        {rule.paused && (
                          <span className="badge paused">Paused</span>
                        )}
                      </strong>
                      <span className="tx-amount">${rule.amount}</span>
                    </div>
                    <p className="tx-note">
                      {accountNameById.get(rule.account_id) ?? "Account"} ·{" "}
                      {RECURRENCE_FREQUENCY_LABELS[rule.frequency]} · starts{" "}
                      {startDateInputValue(rule.start_date)}
                    </p>
                    {rule.note && <p className="tx-note">{rule.note}</p>}
                    <div className="rule-actions">
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => void handlePauseResume(rule)}
                      >
                        {rule.paused ? "Resume" : "Pause"}
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => openEdit(rule)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm danger"
                        onClick={() => setConfirmDeleteId(rule.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      {formOpen && (
        <div className="modal-backdrop" onClick={closeForm}>
          <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
            <h2>{formMode === "create" ? "Add recurring" : "Edit recurring"}</h2>
            <form onSubmit={(e) => void handleSubmit(e)} className="auth-form">
              <label>
                Account
                <select
                  value={form.accountId}
                  onChange={(e) => setForm((f) => ({ ...f, accountId: e.target.value }))}
                  required
                >
                  {accounts.length === 0 && <option value="">No accounts</option>}
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Amount
                <input
                  type="text"
                  inputMode="decimal"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  placeholder="0.00"
                  required
                />
              </label>
              <fieldset className="type-toggle">
                <legend>Type</legend>
                <label>
                  <input
                    type="radio"
                    name="recurring-type"
                    checked={form.type === "income"}
                    onChange={() => setForm((f) => ({ ...f, type: "income" }))}
                  />
                  Income
                </label>
                <label>
                  <input
                    type="radio"
                    name="recurring-type"
                    checked={form.type === "expense"}
                    onChange={() => setForm((f) => ({ ...f, type: "expense" }))}
                  />
                  Expense
                </label>
              </fieldset>
              <label>
                Frequency
                <select
                  value={form.frequency}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      frequency: e.target.value as RecurrenceFrequency,
                    }))
                  }
                >
                  {FREQUENCIES.map((freq) => (
                    <option key={freq} value={freq}>
                      {RECURRENCE_FREQUENCY_LABELS[freq]}
                    </option>
                  ))}
                </select>
              </label>
              <div className="form-field">
                <span className="form-field-label">Start date</span>
                <MiniCalendar
                  value={form.startDate}
                  onChange={(startDate) => setForm((f) => ({ ...f, startDate }))}
                />
              </div>
              <label>
                Note (optional)
                <input
                  type="text"
                  value={form.note}
                  onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                  placeholder="e.g. Rent"
                />
              </label>

              {schedulePreview.length > 0 && (
                <div className="schedule-preview">
                  <h3 className="preview-title">Schedule preview</h3>
                  <ul className="preview-dates">
                    {schedulePreview.map((d) => (
                      <li key={d}>{d}</li>
                    ))}
                  </ul>
                </div>
              )}

              {formError && <p className="error">{formError}</p>}

              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={closeForm}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDeleteId && (
        <div className="modal-backdrop" onClick={() => setConfirmDeleteId(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Delete recurring rule?</h2>
            <p className="muted">This cannot be undone. Future scheduled instances will stop.</p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setConfirmDeleteId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary danger-btn"
                onClick={() => void handleDelete(confirmDeleteId)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
