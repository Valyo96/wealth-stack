import { FormEvent, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ApiClientError } from "../api/types";

export function LoginPage() {
  const { loggedIn, login, register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (loggedIn) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      if (isRegister) {
        await register(email.trim(), password);
      } else {
        await login(email.trim(), password);
      }
    } catch (err) {
      const message =
        err instanceof ApiClientError ? err.message : "Authentication failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <span className="brand-mark lg" />
          <h1>Wealth Stack</h1>
          <p>{isRegister ? "Create your account" : "Sign in to continue"}</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete={isRegister ? "new-password" : "current-password"}
            />
          </label>
          {error && <p className="error">{error}</p>}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Please wait…" : isRegister ? "Register" : "Login"}
          </button>
        </form>
        <button
          type="button"
          className="btn btn-link"
          onClick={() => {
            setIsRegister(!isRegister);
            setError(null);
          }}
        >
          {isRegister
            ? "Already have an account? Sign in"
            : "New here? Create account"}
        </button>
      </div>
    </div>
  );
}
