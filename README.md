<img src="assets/logo.png" alt="givy" width="300" />

A local GitHub-like git viewer with a web UI. Browse repositories, view files with syntax highlighting and markdown rendering, compare branches, and review diffs with inline comments.

## Features

- **Repository browsing** — Scan a directory for `<owner>/<repo>/.git` repos, search by name
- **File viewer** — Syntax highlighting (shiki), markdown preview (GFM), image display, binary detection
- **Diff/compare** — Split and unified views, file-level navigation
- **Inline review** — Add comments to diff lines, range selection, edit/delete
- **Copy Prompt** — Export review comments as formatted text for AI agents
- **Single binary** — Frontend embedded in the Go binary, no runtime dependencies

## Install

```bash
go install github.com/hokaccha/givy@latest
```

Or build from source:

```bash
make build
# Binary: ./givy
```

## Usage

### Start the server

```bash
givy serve ~/src
# Serves repos found at ~/src/<owner>/<repo>/.git
# Open http://localhost:6271
```

### Open a file in the browser

```bash
givy open ~/src/hokaccha/givy/internal/git/repo.go
# Opens the file viewer in your default browser
```

### Review a branch

```bash
# Compare current branch against default branch
givy review

# Compare a specific branch
givy review feature/new-ui

# Explicit base...head
givy review main...feature/new-ui
```

## Development

```bash
make dev            # Start Go backend + Vite dev server with HMR
make test           # Go tests
make test-frontend  # Vitest unit tests
make test-e2e       # Playwright E2E tests
make lint           # All linters
```

## Architecture

```
Browser (React SPA)  ──HTTP JSON API──▶  Go Server (chi)  ──exec.Command──▶  git / filesystem
```

- File browsing reads the actual filesystem (`os.ReadDir` / `os.ReadFile`)
- Diff/compare uses `git diff` between branches
- Comments stored in browser localStorage
- Frontend built with Vite, embedded via `//go:embed`

See [ARCHITECTURE.md](ARCHITECTURE.md) for details.

## License

MIT
