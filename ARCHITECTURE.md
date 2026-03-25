# Architecture

## System Overview

Givy is a single Go binary that serves a React SPA. The frontend is embedded
in the binary at build time via `//go:embed`.

```
┌─────────────────────────────────────────────────────┐
│ Browser (React SPA)                                 │
│  Pages: RepoList, TreeView, BlobView, CompareView   │
│  State: React Router + localStorage (comments)      │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP JSON API
┌──────────────────────▼──────────────────────────────┐
│ Go HTTP Server (chi router)                         │
│  /api/*  → handler layer → git layer → exec.Command │
│  /*      → embedded frontend static files           │
└──────────────────────┬──────────────────────────────┘
                       │ exec.Command("git", ...)
┌──────────────────────▼──────────────────────────────┐
│ Local filesystem                                    │
│  <root_dir>/<owner>/<repo>/.git                     │
└─────────────────────────────────────────────────────┘
```

## Package Layering

```
cmd/           → CLI entry points (cobra commands)
  ↓ imports
internal/server/  → HTTP server setup, routing, middleware, static serving
  ↓ imports
internal/handler/ → HTTP handlers, one file per resource
  ↓ imports
internal/git/     → Git operations via exec.Command, filesystem scanning
```

**Rule**: Dependencies flow downward only. A lower layer never imports a higher one.

## Domains

| Domain | Package | Responsibility |
|--------|---------|---------------|
| CLI | `cmd/` | Parse CLI args, start server, open browser |
| HTTP | `internal/server/` | Server lifecycle, routing, middleware, static files |
| API | `internal/handler/` | Request parsing, response formatting, error mapping |
| Git | `internal/git/` | Execute git commands, parse output, scan repos |

## Frontend Structure

| Directory | Purpose |
|-----------|---------|
| `pages/` | One component per route, handles data fetching |
| `components/` | Reusable UI components (FileTree, DiffViewer, etc.) |
| `hooks/` | Custom React hooks (useComments, useDiff) |
| `lib/` | Pure logic (diff parsing, comment storage) |
| `api/` | API client functions |

## Data Flow

1. User navigates to a URL (e.g., `/owner/repo/tree/main/src`)
2. React Router matches route, renders page component
3. Page component calls API client (`GET /api/repos/owner/repo/tree/main/src`)
4. Go handler receives request, calls git layer
5. Git layer runs `git -C <repo_path> ls-tree main -- src` via exec.Command
6. Output is parsed into structured data, returned as JSON
7. Page component renders the data

No caching at any layer. Every request hits git/filesystem directly.

## Key Design Decisions

- **exec.Command over go-git**: Ensures exact same behavior as git CLI. Simpler to debug.
- **Embedded SPA over SSR**: Single binary distribution. No Node.js runtime needed.
- **localStorage for comments**: No database. Comments are per-browser, per-diff.
- **No caching**: Repos change outside givy. Always show current state.
- **Port 6271**: Uncommon port, unlikely to conflict with other dev tools.
