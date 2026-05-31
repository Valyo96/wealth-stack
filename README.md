# wealth-stack

A personal finance tracking platform for monitoring income, expenses, cash flow, profit & loss, and financial performance in real time.

## Stack

| Component | Technology |
|-----------|------------|
| API | Go 1.23+, [chi](https://github.com/go-chi/chi), JWT |
| Database | PostgreSQL 16, [sqlc](https://sqlc.dev/), [pgx](https://github.com/jackc/pgx) |
| Migrations | [golang-migrate](https://github.com/golang-migrate/migrate) |
| Web | React 19, TypeScript, Vite, React Router |
| Android | Kotlin, Jetpack Compose, Hilt, Retrofit, DataStore |

## Repository layout

```
backend/     Go API
  migrations/        Schema migrations (applied on stack startup)
  migrations-local/  Local dev seeds only (manual — see seed-demo.ps1)
web/         React web app
android/     Android app (open in Android Studio)
deploy/      docker-compose for Postgres, API, and web
docs/        architecture, API, roadmap
```

## Prerequisites

- [Docker Desktop](https://www.docker.com/) (Postgres, API, and web — **no Go or Node install required** for Docker)
- [Node.js](https://nodejs.org/) 20+ (optional — only for local web dev with hot reload)
- [Android Studio](https://developer.android.com/studio) (Ladybug or newer, optional)
- **JDK 23+** (required for Android builds and tests — see [Running tests locally](#running-tests-locally))

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

Use the same register/login flow as mobile. Dashboard and Transactions mirror the Android screens.

### 5. Android

1. Install **JDK 23+** and point Android Studio to it (**Settings → Build, Execution, Deployment → Build Tools → Gradle → Gradle JDK**).
2. Open the `android/` folder in Android Studio (installs the Android SDK on first launch).
3. Start an emulator (API 26+).
4. Run the **app** configuration.

Debug builds call `http://10.0.2.2:8080/` (emulator → host machine). Cleartext is allowed in debug only.

If Gradle cannot find your SDK, copy [`android/local.properties.example`](android/local.properties.example) to `android/local.properties` and set `sdk.dir`.

### 6. Try the flow

1. Register a new account in the **web app** or **Android app** (password at least 8 characters).
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

Run these before opening a PR to match CI behavior. Use **`make ci`** to run backend, web, and Android checks in one command (requires Go, Node.js, Docker, JDK 23+, and Android SDK).

### Prerequisites by stack

| Stack | Required tools |
|-------|----------------|
| Backend | [Go 1.23+](https://go.dev/dl/), Docker Desktop (integration tests only) |
| Web | [Node.js 20+](https://nodejs.org/) |
| Android | **JDK 23+**, Android SDK (via Android Studio), Gradle wrapper (`android/gradlew`) |

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
cd web
npm ci
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

### Android (Kotlin)

Requires **JDK 23+** and a configured Android SDK.

**Windows (PowerShell):**

```powershell
# Ensure JAVA_HOME points to JDK 23+
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-23"

cd android
.\gradlew.bat testDebugUnitTest
.\gradlew.bat lintDebug
```

**macOS / Linux / Git Bash:**

```bash
export JAVA_HOME=$(/usr/libexec/java_home -v 23)   # macOS example
cd android
./gradlew testDebugUnitTest
./gradlew lintDebug
```

Or with Make:

```powershell
make android-test
make android-lint
make android-ci
```

Unit tests live under [`android/app/src/test/`](android/app/src/test/) and cover API helpers, auth interceptor behavior, and login validation logic.

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
| `make android-test` | Android unit tests (JDK 23+, Android SDK) |
| `make android-lint` | Android lint (debug variant) |
| `make android-ci` | Full Android CI parity |
| `make ci` | Full CI parity (backend + frontend + Android) |

## CI/CD

Pull requests to `main` run automated validation via GitHub Actions:

- **Backend CI** — lint, unit tests, integration tests (Testcontainers + Postgres), race detector, coverage
- **Frontend CI** — ESLint, TypeScript, build, Vitest coverage
- **Android CI** — unit tests and lint on **JDK 23**
- **Sonar Analysis** — SonarCloud quality gate and PR decoration

Configure the `SONAR_TOKEN` repository secret before enabling Sonar as a required check. See [CI/CD Runbook](docs/ci.md) for setup, branch protection, and troubleshooting.

## Documentation

- [Architecture](docs/architecture.md)
- [API](docs/api.md)
- [Roadmap](docs/roadmap.md)
- [CI/CD Runbook](docs/ci.md)

## License

Private / personal project.
