.PHONY: dev migrate-up migrate-down sqlc-generate test backend-run backend-docker web-dev stack-up stack-down seed-demo

DATABASE_URL ?= postgres://wealthstack:wealthstack@localhost:5432/wealthstack?sslmode=disable
COMPOSE_FILE = deploy/docker-compose.yml

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

test:
	cd backend && go test ./...

backend-run:
	cd backend && go run ./cmd/api

backend-docker:
	docker compose -f $(COMPOSE_FILE) up --build api

web-dev:
	cd web && npm install && npm run dev
