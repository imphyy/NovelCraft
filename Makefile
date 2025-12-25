.PHONY: help test test-backend test-frontend test-unit test-integration build run migrate-up migrate-down docker-up docker-down

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-20s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# Database
docker-up: ## Start PostgreSQL database
	cd infra && docker compose up -d

docker-down: ## Stop PostgreSQL database
	cd infra && docker compose down

migrate-up: ## Run database migrations up
	./migrate -path backend/migrations -database "postgres://novelcraft:novelcraft@localhost:5432/novelcraft?sslmode=disable" up

migrate-down: ## Run database migrations down
	./migrate -path backend/migrations -database "postgres://novelcraft:novelcraft@localhost:5432/novelcraft?sslmode=disable" down

migrate-test-up: ## Run database migrations for test database
	./migrate -path backend/migrations -database "postgres://novelcraft:novelcraft@localhost:5432/novelcraft_test?sslmode=disable" up

migrate-test-down: ## Run database migrations for test database down
	./migrate -path backend/migrations -database "postgres://novelcraft:novelcraft@localhost:5432/novelcraft_test?sslmode=disable" down

# Build
build: ## Build backend binary
	cd backend && go build -o ../bin/api ./cmd/api

build-frontend: ## Build frontend for production
	cd frontend && npm run build

# Run
run: ## Run backend server
	cd backend && go run ./cmd/api

dev-frontend: ## Run frontend dev server
	cd frontend && npm run dev

# Testing
test: test-backend test-frontend ## Run all tests

test-backend: ## Run all backend tests
	cd backend && go test -v ./...

test-backend-unit: ## Run backend unit tests only
	cd backend && go test -v -short ./...

test-backend-integration: ## Run backend integration tests
	cd backend && go test -v ./...

test-backend-coverage: ## Run backend tests with coverage
	cd backend && go test -v -coverprofile=coverage.out ./...
	cd backend && go tool cover -html=coverage.out -o coverage.html

test-frontend: ## Run frontend tests
	cd frontend && npm run test

test-frontend-coverage: ## Run frontend tests with coverage
	cd frontend && npm run test:coverage

# Code Quality
lint-backend: ## Run Go linter
	cd backend && golangci-lint run

lint-frontend: ## Run frontend linter
	cd frontend && npm run lint

format-backend: ## Format Go code
	cd backend && go fmt ./...

# Setup
setup: docker-up migrate-up ## Setup development environment
	@echo "Development environment ready!"
	@echo "Run 'make run' to start the backend"
	@echo "Run 'make dev-frontend' to start the frontend"

setup-test: docker-up ## Setup test environment
	@echo "Creating test database..."
	@docker exec novelcraft-db psql -U novelcraft -c "CREATE DATABASE novelcraft_test;" || true
	@$(MAKE) migrate-test-up
	@echo "Test environment ready!"
	@echo "Run 'make test' to run tests"

clean: ## Clean build artifacts
	rm -rf backend/api
	rm -rf frontend/dist
	rm -rf bin/

clean-test: ## Clean test database
	@docker exec novelcraft-db psql -U novelcraft -c "DROP DATABASE IF EXISTS novelcraft_test;"
