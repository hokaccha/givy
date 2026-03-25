# Givy — Agent Guide

A local GitHub-like git viewer. This file is a table of contents for AI agents.
Read this first, then follow links to the relevant docs.

## Quick Start

```bash
make dev          # Start dev server (Go backend + Vite frontend)
make test         # Run all Go tests
make test-frontend # Run Vitest unit tests
make test-e2e     # Run Playwright E2E tests
make lint         # Run all linters
make build        # Build production binary
```

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for the top-level system map:
domains, package layering, dependency rules, and data flow.

## Design Documents

| Document | Purpose |
|----------|---------|
| [docs/design-docs/overview.md](docs/design-docs/overview.md) | Core design: tech stack, data flow, key decisions |

## References

| Document | Purpose |
|----------|---------|
| [docs/references/api.md](docs/references/api.md) | REST API endpoint specs (request/response shapes) |
| [docs/references/git-operations.md](docs/references/git-operations.md) | Git commands used and their output formats |
| [docs/references/url-routing.md](docs/references/url-routing.md) | Frontend URL structure and route params |

## Testing

| Document | Purpose |
|----------|---------|
| [docs/testing/test-plan.md](docs/testing/test-plan.md) | Comprehensive test plan (unit, integration, E2E) |
| [docs/testing/e2e-patterns.md](docs/testing/e2e-patterns.md) | E2E test patterns with Playwright |

## Key Constraints

- **Language**: All code, comments, docs, and commit messages in English
- **Git operations**: Always use `exec.Command("git", ...)` — no git libraries
- **No caching**: File trees and diffs fetched from git/filesystem on every request
- **Dependency direction**: `types → git → handler → server → cmd` (never reverse)
- **Frontend**: React + TypeScript + Tailwind CSS v4, built with Vite, embedded in Go binary
