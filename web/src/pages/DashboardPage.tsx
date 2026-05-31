import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";
import type { DashboardSummary } from "../api/types";

function formatMoney(value: string): string {
  const n = parseFloat(value);
  if (Number.isNaN(n)) return value;
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
  }).format(n);
}

export function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const accounts = await api.listAccounts();
      if ((accounts ?? []).length === 0) {
        await api.createAccount("Main Wallet");
      }
      const data = await api.dashboardSummary();
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">Your financial snapshot for the current period</p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={() => void load()}>
          Refresh
        </button>
      </div>

      {loading && <p className="muted">Loading…</p>}
      {error && <p className="error">{error}</p>}

      {summary && !loading && (
        <>
          <p className="period-label">{summary.period_label}</p>
          <div className="stat-grid">
            <article className="stat-card income">
              <span className="stat-label">Income</span>
              <span className="stat-value">{formatMoney(summary.total_income)}</span>
            </article>
            <article className="stat-card expense">
              <span className="stat-label">Expenses</span>
              <span className="stat-value">{formatMoney(summary.total_expenses)}</span>
            </article>
            <article className="stat-card net">
              <span className="stat-label">Net</span>
              <span className="stat-value">{formatMoney(summary.net)}</span>
            </article>
          </div>
        </>
      )}
    </div>
  );
}
