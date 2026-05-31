# Architecture

## Overview

Wealth Stack is a monorepo with three clients sharing one API:

- **Backend** — Go REST API (`backend/`)
- **Web** — React SPA (`web/`)
- **Mobile** — Android app (`android/`)

PostgreSQL is the system of record. Web and mobile clients authenticate with JWT and call the same `/v1/*` endpoints.

## Backend layers

```
cmd/api          → process entry, HTTP server lifecycle
internal/config  → environment configuration
internal/http    → chi router, handlers, middleware (CORS, JWT)
internal/auth    → password hashing, JWT issue/parse, register/login
internal/finance → accounts, transactions, dashboard aggregation
internal/store   → sqlc-style SQL access via pgx
migrations/       → schema versioning (golang-migrate, applied in all environments)
migrations-local/ → local dev seed data (auto in deploy/docker-compose.yml, not for production)
queries/         → SQL source for sqlc (`make sqlc-generate`)
```

Protected routes require `Authorization: Bearer <access_token>`. All finance data is scoped by `user_id` from JWT claims.

## Web layers

```
src/pages/       → Login, Dashboard, Transactions
src/components/  → Layout, protected route wrapper
src/context/     → Auth state (login/register/logout)
src/api/         → fetch client + types (mirrors REST API)
```

Dev server runs on **http://localhost:5173** and proxies `/v1` to the API on port 8080. In Docker, nginx serves the built app on port 5173 and proxies `/v1` to the `api` service. Tokens are stored in `localStorage`.

## Android layers

```
ui/              → Compose screens (Login, Dashboard, Transactions)
viewmodel/       → UI state, calls repositories
data/repository/ → domain-facing API wrappers
data/api/        → Retrofit interface + DTOs
data/local/      → DataStore token persistence
di/              → Hilt modules (network, etc.)
```

## Data flow

1. User registers or logs in → API returns access + refresh tokens.
2. Client stores tokens (web: localStorage, Android: DataStore) and sends Bearer token on requests.
3. Dashboard calls `GET /v1/dashboard/summary` for current-month totals.
4. Transactions list/create via `/v1/transactions`.

## Real-time (phase 2)

Skeleton uses manual refresh. Future: SSE or WebSocket stream for live dashboard updates.
