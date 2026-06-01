# Architecture

## Overview

Wealth Stack is a monorepo with three clients sharing one API:

- **Backend** — Go REST API (`backend/`)
- **Web** — React SPA (`web/`)
- **Mobile** — Expo React Native app (`mobile/`) for Android and iOS
- **Shared** — TypeScript API client and DTOs (`packages/shared/`)

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
src/api/         → thin adapter over @wealth-stack/shared (localStorage tokens)
```

Dev server runs on **http://localhost:5173** and proxies `/v1` to the API on port 8080. In Docker, nginx serves the built app on port 5173 and proxies `/v1` to the `api` service.

## Mobile layers

```
app/             → Expo Router screens (auth + tab navigation)
src/api/         → Secure Store token adapter over @wealth-stack/shared
src/store/       → Zustand auth session
src/components/  → reusable UI
src/providers/   → TanStack Query client
```

Tokens are stored in **expo-secure-store**. The shared client refreshes access tokens on `401` via `POST /v1/auth/refresh`.

## Shared package

```
packages/shared/src/
  types.ts       → DTOs and ApiClientError
  apiClient.ts   → createWealthStackApi (fetch, envelope parsing, JWT refresh)
```

## Data flow

1. User registers or logs in → API returns access + refresh tokens.
2. Client stores tokens (web: localStorage, mobile: Secure Store) and sends Bearer token on requests.
3. Dashboard calls `GET /v1/dashboard/summary` for current-month totals.
4. Transactions list/create via `/v1/transactions`.

## Real-time (phase 2)

Skeleton uses manual refresh. Future: SSE or WebSocket stream for live dashboard updates on web and mobile.
