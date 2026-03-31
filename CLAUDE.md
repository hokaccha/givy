# CLAUDE.md — Project Instructions for Claude Code

## Build & Run Commands

```bash
# Development
make dev              # Start Go backend + Vite dev server concurrently
                      # Frontend (Vite): http://localhost:5173
                      # Backend (Go):    http://localhost:16271
                      # Access the app via the frontend URL (Vite proxies /api to backend)

# Testing
make test             # Go tests: go test ./...
make test-frontend    # Frontend unit tests: pnpm --dir frontend test
make test-e2e         # Playwright E2E tests (uses port 6272, separate from dev server)
make lint             # All linters: golangci-lint + eslint + prettier

# Building
make build            # Build frontend, then build Go binary with embedded assets

# Browser automation (for visual inspection / screenshots)
npx @playwright/cli open <url>       # Open browser
npx @playwright/cli screenshot       # Take screenshot
npx @playwright/cli snapshot         # Get page snapshot (accessibility tree)
npx @playwright/cli close            # Close browser
```

## Coding Conventions

- **Language**: All code, comments, docs, commit messages, and variable names in English
- **Go**: Follow standard Go conventions. Use `gofmt`. No exported symbols without doc comments.
- **TypeScript**: Strict mode. Prefer named exports. Use function components with hooks.
- **CSS**: Tailwind CSS v4 utility classes. No custom CSS unless absolutely necessary.
- **Tests**: Every new feature needs tests. Use the checklist below to determine what tests to write.
  - **Follow the test plan**: Before writing tests, read `docs/testing/test-plan.md` to understand the test layers and what belongs where.
  - **Verify with executable tests**: Always run `make test-frontend` or `make test-e2e` to confirm changes work. Do not rely solely on visual inspection or screenshots.
  - **Update test plan**: When adding new test files or test coverage, update `docs/testing/test-plan.md` in the same commit.

### Required Tests by Change Type

| What you changed | Required test | Where |
|---|---|---|
| New/modified exported function in `internal/git/` | Unit test | `internal/git/*_test.go` |
| New/modified API endpoint in `internal/handler/` | Integration test with `httptest` | `internal/handler/handler_test.go` |
| New/modified page or route in `frontend/src/pages/` | E2E test | `frontend/e2e/*.spec.ts` |
| New/modified utility in `frontend/src/lib/` | Unit test | `frontend/src/__tests__/*.test.ts` |
| Bug fix | Regression test covering the bug | Appropriate layer from above |

**A feature is not done until its tests pass.** Do not commit code changes without the corresponding tests.

## Architecture Rules

Dependency direction (strictly enforced):
```
types → git → handler → server → cmd
```

- `internal/git/` must not import any other internal package
- `internal/handler/` may import `internal/git/` only
- `internal/server/` may import `internal/handler/` and `internal/git/`
- `cmd/` may import `internal/server/`
- Frontend components must not call git commands or access filesystem directly

## Git Operations

All git interaction happens through `exec.Command("git", ...)` in `internal/git/`.
Do not use go-git or any git library. This ensures output matches what users expect
and avoids library-specific edge cases.

## File Organization

- One handler per resource in `internal/handler/`
- One page component per route in `frontend/src/pages/`
- Shared UI components in `frontend/src/components/`
- Git operation functions grouped by domain in `internal/git/`

## Error Handling

- Go: Return errors, don't panic. Wrap with context using `fmt.Errorf("...: %w", err)`.
- Frontend: Use error boundaries for page-level errors. Show user-friendly messages.
- API: Return appropriate HTTP status codes with JSON error bodies `{"error": "message"}`.

## Documentation Maintenance

When making code changes, update the corresponding docs **in the same commit**.
Check the table below to determine which docs to update.

| What changed | Update |
|---|---|
| API endpoints (handler routes, request/response shape) | `docs/references/api.md` |
| Frontend routes or URL structure | `docs/references/url-routing.md` |
| Git commands used in `internal/git/` | `docs/references/git-operations.md` |
| CLI commands (`cmd/`) | `docs/ARCHITECTURE.md` (Domains table) |
| Package structure or dependency direction | `docs/ARCHITECTURE.md` |
| New bug fix with non-obvious root cause | `docs/references/known-issues.md` |
| Tech stack, design decisions, data flow | `docs/design-docs/overview.md`, `docs/ARCHITECTURE.md` |

If unsure whether a doc needs updating, read it and check — stale docs are worse than missing docs.
