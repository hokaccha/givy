ROOT_DIR := $(shell cd ../.. && pwd)
DEV_PORT := 16271

.PHONY: dev dev-backend dev-frontend build test test-frontend test-e2e lint lint-go lint-frontend clean

# Development
dev:
	@echo "Starting dev servers..."
	$(MAKE) -j2 dev-backend dev-frontend

dev-backend:
	air -- serve --dev --port $(DEV_PORT) $(ROOT_DIR)

dev-frontend:
	cd frontend && GIVY_PORT=$(DEV_PORT) pnpm dev

# Build
build: build-frontend
	go build -ldflags "-X github.com/hokaccha/givy/cmd.Version=$(VERSION)" -o givy .

build-frontend:
	cd frontend && pnpm build

# Test
test:
	go test ./...

test-frontend:
	cd frontend && pnpm test

test-e2e:
	cd frontend && pnpm test:e2e

test-all: test test-frontend test-e2e

# Lint
lint: lint-go lint-frontend

lint-go:
	golangci-lint run ./...

lint-frontend:
	cd frontend && pnpm lint

# Clean
clean:
	rm -f givy
	rm -rf frontend/dist
