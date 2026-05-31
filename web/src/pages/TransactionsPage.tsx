import { FormEvent, useCallback, useEffect, useState } from "react";
import { api } from "../api/client";
import type { Account, Transaction } from "../api/types";

export function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [txs, accts] = await Promise.all([
        api.listTransactions(),
        api.listAccounts(),
      ]);
      setTransactions(txs);
      setAccounts(accts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const accountId = accounts[0]?.id;
    if (!accountId) {
      setError("Create an account on the dashboard first");
      return;
    }
    if (!amount.trim()) {
      setError("Amount is required");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await api.createTransaction(accountId, amount.trim(), type);
      setShowForm(false);
      setAmount("");
      setType("expense");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create transaction");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Transactions</h1>
          <p className="muted">Track income and expenses</p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
        >
          Add transaction
        </button>
      </div>

      {error && <p className="error">{error}</p>}
      {loading && <p className="muted">Loading…</p>}

      {!loading && transactions.length === 0 && (
        <p className="empty">No transactions yet. Add your first one.</p>
      )}

      <ul className="tx-list">
        {transactions.map((tx) => (
          <li key={tx.id} className={`tx-item ${tx.transaction_type}`}>
            <div>
              <strong>
                {tx.transaction_type === "income" ? "Income" : "Expense"}
              </strong>
              <span className="tx-amount">${tx.amount}</span>
            </div>
            <time className="muted">
              {new Date(tx.occurred_at).toLocaleString()}
            </time>
            {tx.note && <p className="tx-note">{tx.note}</p>}
          </li>
        ))}
      </ul>

      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Add transaction</h2>
            <form onSubmit={(e) => void handleSubmit(e)} className="auth-form">
              <label>
                Amount
                <input
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </label>
              <fieldset className="type-toggle">
                <legend>Type</legend>
                <label>
                  <input
                    type="radio"
                    name="type"
                    checked={type === "income"}
                    onChange={() => setType("income")}
                  />
                  Income
                </label>
                <label>
                  <input
                    type="radio"
                    name="type"
                    checked={type === "expense"}
                    onChange={() => setType("expense")}
                  />
                  Expense
                </label>
              </fieldset>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowForm(false)}
                >
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
    </div>
  );
}
