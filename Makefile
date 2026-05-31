.PHONY: dev migrate-up migrate-down sqlc-generate test test-unit test-integration test-race lint lint-backend lint-frontend \
	backend-coverage frontend-coverage android-coverage sonar-coverage ci backend-ci frontend-ci \
	android-test android-lint android-ci stack-up stack-down seed-demo

DATABASE_URL ?= postgres://wealthstack:wealthstack@localhost:5432/wealthstack?sslmode=disable
COMPOSE_FILE = deploy/docker-compose.yml
BACKEND_PACKAGES := $(shell cd backend && go list ./... | grep -v /integration)

dev:
	docker compose -f $(COMPOSE_FILE) up -d postgres

stack-up:
	docker compose -f $(COMPOSE_FILE) up --build -d

seed-demo:
	docker compose -f $(COMPOSE_FILE) up -d postgres
	docker compose -f $(COMPOSE_FILE) run --rm migrate
	docker compose -f $(COMPOSE_FILE) run --rm migrate-local

stack-down:
	docker compose -f $(COMPOSE_FILE) down

migrate-up:
	docker compose -f $(COMPOSE_FILE) up -d postgres
	docker compose -f $(COMPOSE_FILE) run --rm migrate

migrate-down:
	docker compose -f $(COMPOSE_FILE) run --rm migrate -path /migrations -database "postgres://wealthstack:wealthstack@postgres:5432/wealthstack?sslmode=disable" down 1

sqlc-generate:
	cd backend && sqlc generate

test: test-unit

test-unit:
	cd backend && go test $(BACKEND_PACKAGES) -coverprofile=coverage.out -covermode=atomic

test-integration:
	cd backend && go test -tags=integration ./internal/integration/... -v -timeout 5m

test-race:
	cd backend && go test -race $(BACKEND_PACKAGES) -timeout 5m

backend-coverage:
	bash scripts/generate-backend-coverage.sh
	bash scripts/check-backend-coverage.sh reports/coverage/backend/coverage.out

frontend-coverage:
	bash scripts/generate-frontend-coverage.sh

android-coverage:
	bash scripts/generate-android-coverage.sh

sonar-coverage:
	bash scripts/generate-all-coverage.sh

lint: lint-backend lint-frontend

lint-backend:
	cd backend && go vet ./...
	cd backend && test -z "$$(gofmt -l .)" || (gofmt -l . && exit 1)

lint-frontend:
	cd web && npm ci && npm run lint

backend-ci: lint-backend test-unit test-integration test-race backend-coverage

frontend-ci:
	cd web && npm ci && npm run lint && npm run typecheck && npm run build && npm run coverage:sonar

android-test:
	cd android && chmod +x ./gradlew && ./gradlew testDebugUnitTest jacocoTestReport --no-daemon

android-lint:
	cd android && chmod +x ./gradlew && ./gradlew lintDebug --no-daemon

android-ci: android-test android-lint

ci: backend-ci frontend-ci android-ci

backend-run:
	cd backend && go run ./cmd/api

backend-docker:
	docker compose -f $(COMPOSE_FILE) up --build api

web-dev:
	cd web && npm install && npm run dev
