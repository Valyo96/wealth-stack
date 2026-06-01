# wealth-stack

A personal finance tracking platform for monitoring income, expenses, cash flow, profit & loss, and financial performance in real time.

## Stack

| Component | Technology |
|-----------|------------|
| API | Go 1.23+, [chi](https://github.com/go-chi/chi), JWT |
| Database | PostgreSQL 16, [sqlc](https://sqlc.dev/), [pgx](https://github.com/jackc/pgx) |
| Migrations | [golang-migrate](https://github.com/golang-migrate/migrate) |
| Web | React 19, TypeScript, Vite, React Router |
| Mobile | Expo, React Native, TypeScript, TanStack Query, Zustand |
| Shared | `@wealth-stack/shared` — API types and HTTP client (web + mobile) |

## Repository layout

```
backend/     Go API
  migrations/        Schema migrations (applied on stack startup)
  migrations-local/  Local dev seeds only (manual — see seed-demo.ps1)
web/         React web app
mobile/      Expo React Native app (Android + iOS)
packages/shared/  Shared API client and DTOs
deploy/      docker-compose for Postgres, API, and web
docs/        architecture, API, roadmap
```

## Prerequisites

- [Docker Desktop](https://www.docker.com/) (Postgres, API, and web — **no Go or Node install required** for Docker)
- [Node.js](https://nodejs.org/) 20+ (web and mobile local dev)
- [Expo Go](https://expo.dev/go) or Android Studio / Xcode simulator (optional, for mobile)

Optional for local backend development:

- [Go](https://go.dev/dl/) 1.23+ (add `C:\Program Files\Go\bin` to your PATH after install)
- [sqlc](https://docs.sqlc.dev/en/latest/overview/install.html) (optional; generated store is committed)
- [golang-migrate](https://github.com/golang-migrate/migrate) CLI if you prefer running migrations outside Docker

## Quick start (Docker — full stack)

Start **Postgres, schema migrations, local demo seed, API, and web UI** in one command:

```powershell
docker compose -f deploy/docker-compose.yml up --build
```

Startup order:

1. **Postgres** (data persisted in Docker volume `wealthstack_pgdata`)
2. **migrate** — schema from `backend/migrations/` (automatic)
3. **migrate-local** — demo seed from `backend/migrations-local/` (automatic in this compose file only)
4. **api** → http://localhost:8080
5. **web** → http://localhost:5173

Demo login after first start: `admin@nowhere.com` / `password123`

```powershell
docker compose -f deploy/docker-compose.yml up --build
```

Or use the helper script:

```powershell
.\scripts\start-stack.ps1
```

| Service | URL |
|---------|-----|
| Web UI | http://localhost:5173 |
| API | http://localhost:8080 |
| Postgres | localhost:5432 |

Run detached (background):

```powershell
docker compose -f deploy/docker-compose.yml up --build -d
```

Stop everything:

```powershell
docker compose -f deploy/docker-compose.yml down
```

---

## Quick start (step by step)

### 1. Database

```powershell
copy .env.example .env
docker compose -f deploy/docker-compose.yml up -d postgres
```

Postgres listens on `localhost:5432` (user/password/db: `wealthstack`).

### 2. Migrations

**Windows (PowerShell)** — recommended, no extra tools:

```powershell
.\scripts\migrate-up.ps1
```

**Docker Compose** (any OS):

```powershell
docker compose -f deploy/docker-compose.yml run --rm migrate
```

**Optional — local migrate CLI** (only if installed):

```powershell
migrate -path backend/migrations -database "postgres://wealthstack:wealthstack@localhost:5432/wealthstack?sslmode=disable" up
```

Or with Make: `make migrate-up`

### 3. API

**Windows (PowerShell)** — no Go install needed:

```powershell
.\scripts\start-api.ps1
```

This starts Postgres, runs migrations, builds the API in Docker, and serves it at `http://localhost:8080`. The web UI is included at `http://localhost:5173`.

Or run services individually (if DB + migrations are already done):

```powershell
docker compose -f deploy/docker-compose.yml up --build api web
```

**Optional — local Go** (after installing [Go 1.23+](https://go.dev/dl/) and reopening PowerShell):

```powershell
cd backend
go mod tidy
go run ./cmd/api
```

Install Go on Windows quickly:

```powershell
winget install GoLang.Go
```

Then **close and reopen PowerShell** so `go` is on your PATH.

API: `http://localhost:8080` — try `GET /health`.

Environment variables (see `.env.example`):

| Variable | Default |
|----------|---------|
| `DATABASE_URL` | local Postgres URL |
| `JWT_SECRET` | dev placeholder |
| `HTTP_PORT` | `8080` |

### 4. Web app

**Docker (included in full stack above):** open http://localhost:5173 after `docker compose up`.

**Local dev with hot reload** (requires Node.js):

```powershell
.\scripts\start-web.ps1
```

Or manually:

```powershell
cd web
npm install
npm run dev
```

Open **http://localhost:5173** in your browser. The dev server proxies API calls to `localhost:8080`.

Use the same register/login flow as mobile. Dashboard and Transactions mirror the mobile app.

### 5. Mobile (Expo)

From the repository root:

```powershell
npm install
npm run build -w @wealth-stack/shared
cd mobile
npm run start
```

Set the API URL for your device/emulator (create `mobile/.env`):

| Environment | `EXPO_PUBLIC_API_BASE_URL` |
|-------------|----------------------------|
| Android emulator | `http://10.0.2.2:8080` |
| iOS simulator | `http://localhost:8080` |
| Physical device | `http://<your-lan-ip>:8080` |

Scan the QR code with Expo Go, or press `a` / `i` for Android / iOS simulator.

### 6. Try the flow

1. Register a new account in the **web app** or **mobile app** (password at least 8 characters).
2. Dashboard loads monthly summary (zeros until you add data).
3. Open **Transactions** → **+** to add income or expense (a default account is created if needed).

### Demo data (optional)

Seed a sample user with realistic May transactions. **Runs automatically** when you use `docker compose up` (this dev compose file only — not for production):

Demo login: `admin@nowhere.com` / `password123`

To re-apply schema + seed manually without restarting the stack:

```powershell
.\scripts\seed-demo.ps1
```

| Field | Value |
|-------|--------|
| Email | `admin@nowhere.com` |
| Password | `password123` |

**Log out and sign in again** after seeding. Local seed files live in [`backend/migrations-local/`](backend/migrations-local/).

---

## Running tests locally

Run these before opening a PR to match CI behavior. Use **`make ci`** to run backend, web, and mobile checks in one command (requires Go, Node.js, and Docker for integration tests).

### Prerequisites by stack

| Stack | Required tools |
|-------|----------------|
| Backend | [Go 1.23+](https://go.dev/dl/), Docker Desktop (integration tests only) |
| Web | [Node.js 20+](https://nodejs.org/) |
| Mobile | Node.js 20+, npm workspaces (install at repo root) |

### Backend (Go)

**IntelliJ / IDE terminal — `go` not recognized?**

IntelliJ caches PATH when the IDE starts. Either **fully restart IntelliJ** (File → Exit, then reopen), or use the helper scripts (they call Go by full path):

```powershell
# From repo root — works without fixing PATH
.\scripts\test-backend.ps1
.\scripts\test-backend-integration.ps1   # Docker must be running
```

In IntelliJ: **Settings → Languages & Frameworks → Go → GOROOT** → set to `C:\Program Files\Go`.

To refresh PATH in the current terminal only:

```powershell
. .\scripts\ensure-go.ps1
go version
```

**Unit tests** (fast, no Docker):

```powershell
cd backend
go test ./...
```

Or from repo root:

```powershell
.\scripts\test-backend.ps1
```

Or with Make:

```powershell
make test-unit
```

**Integration tests** (Postgres via Testcontainers — **Docker must be running**):

```powershell
.\scripts\test-backend-integration.ps1
```

Or:

```powershell
make test-integration
```

**Race detector:**

```powershell
make test-race
```

**Full backend CI parity** (lint, unit + integration tests, race detector, coverage threshold):

```powershell
make backend-ci
```

### Web (React + TypeScript)

```powershell
npm install
npm run build -w @wealth-stack/shared
cd web
npm run lint
npm run typecheck
npm run build
npm run coverage
```

Or:

```powershell
make frontend-ci
```

`npm run coverage` runs Vitest and enforces minimum coverage thresholds defined in [`web/vitest.config.ts`](web/vitest.config.ts).

### Mobile (Expo + React Native)

From the repository root:

```powershell
npm install
npm run build -w @wealth-stack/shared
cd mobile
npm run lint
npm run typecheck
npm run test
```

Or:

```powershell
make mobile-ci
```

Tests live under [`mobile/src/`](mobile/src/) and [`packages/shared/src/`](packages/shared/src/).

### Run everything

```powershell
make ci
```

Individual Make targets are listed below.

## Make targets

| Target | Description |
|--------|-------------|
| `make stack-up` | Start full stack in background (Postgres + migrations + API + web) |
| `make stack-down` | Stop all compose services |
| `make seed-demo` | Apply local-only demo seed (`backend/migrations-local/`) |
| `make migrate-up` | Apply migrations |
| `make migrate-down` | Roll back one migration |
| `make sqlc-generate` | Regenerate `internal/store` from SQL |
| `make backend-run` | Run API locally (requires Go) |
| `make backend-docker` | Build and run API in Docker |
| `make web-dev` | Start web dev server (requires Node) |
| `make test` | Go unit tests |
| `make test-integration` | Go integration tests (requires Docker) |
| `make test-race` | Go tests with race detector |
| `make lint` | Backend + frontend lint |
| `make backend-ci` | Full backend CI parity |
| `make frontend-ci` | Full frontend CI parity |
| `make mobile-start` | Start Expo dev server |
| `make mobile-test` | Mobile Jest tests |
| `make mobile-ci` | Full mobile CI parity |
| `make ci` | Full CI parity (backend + frontend + mobile) |

## CI/CD

Pull requests to `main` run the **[CI Pipeline](.github/workflows/ci.yml)** workflow:

1. **Backend, frontend, and mobile validation** run in parallel (lint, tests, coverage).
2. **SonarCloud analysis** runs last, using coverage artifacts from all three stacks.

Configure the `SONAR_TOKEN` repository secret and **disable SonarCloud Automatic Analysis** (CI is the source of truth). See [CI/CD Runbook](docs/ci.md) for setup, branch protection, and troubleshooting.

## Documentation

- [Architecture](docs/architecture.md)
- [API](docs/api.md)
- [Roadmap](docs/roadmap.md)
- [CI/CD Runbook](docs/ci.md)
- [Coverage & Sonar imports](docs/coverage.md)

## License

Private / personal project.
