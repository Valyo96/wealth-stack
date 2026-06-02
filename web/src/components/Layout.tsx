import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { ReactNode } from "react";

export function Layout({ children }: { children: ReactNode }) {
  const { logout } = useAuth();

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" />
          <span>Wealth Stack</span>
        </div>
        <nav className="nav">
          <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
            Dashboard
          </NavLink>
          <NavLink
            to="/transactions"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            Transactions
          </NavLink>
          <NavLink
            to="/recurring"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            Recurring
          </NavLink>
        </nav>
        <button type="button" className="btn btn-ghost" onClick={logout}>
          Logout
        </button>
      </header>
      <main className="main">{children}</main>
    </div>
  );
}
