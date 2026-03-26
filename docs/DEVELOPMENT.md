# Development

## Prerequisites

- Go 1.23+
- Node.js 20+
- pnpm

## Getting Started

```bash
# Install frontend dependencies
pnpm --dir frontend install

# Start Go backend + Vite dev server with HMR
make dev
```

The dev server runs at `http://localhost:6271` by default.

## Commands

```bash
make dev              # Start Go backend + Vite dev server concurrently
make test             # Go tests: go test ./...
make test-frontend    # Frontend unit tests: pnpm --dir frontend test
make test-e2e         # Playwright E2E tests
make lint             # All linters: golangci-lint + eslint + prettier
make build            # Build frontend, then build Go binary with embedded assets
```

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for details on the system architecture, package layering, and data flow.
