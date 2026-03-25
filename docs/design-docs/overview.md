# Design Overview

## Purpose

Givy is a local GitHub-like git viewer. It serves a web UI for browsing
git repositories on the local filesystem, viewing files, comparing branches,
and reviewing diffs with inline comments.

## Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| CLI | Go + Cobra | Single binary, fast startup, good CLI ecosystem |
| HTTP | Go + chi/v5 | Lightweight, idiomatic, supports wildcards in routes |
| Frontend | React 19 + TypeScript | Rich interactivity needed for diff/comment UI |
| Build | Vite | Fast builds, good React/TS support |
| Styling | Tailwind CSS v4 | Utility-first, GitHub-like design achievable |
| Syntax HL | shiki | VS Code quality highlighting, on-demand language loading |
| Markdown | react-markdown + remark-gfm | GitHub-flavored markdown rendering |
| Embedding | Go embed | Single binary distribution |

## Data Flow

All data is fetched live from git/filesystem on every request:

1. Frontend makes API call → Go handler → `internal/git/` → `exec.Command("git", ...)`
2. Git output is parsed into Go structs → serialized as JSON → returned to frontend
3. Frontend renders the data

Comments are stored entirely in the browser's localStorage.

## Key Decisions

### Why exec.Command over go-git?
- Exact same output as git CLI — no library-specific edge cases
- Easier to debug: just run the same command in terminal
- git is always available on the target machine

### Why embedded SPA over server-side rendering?
- Single binary distribution — no Node.js runtime needed in production
- Rich interactivity for diff viewer and comment system
- Vite dev server with HMR for fast development

### Why localStorage for comments?
- No database to manage
- Comments are inherently per-developer, per-machine
- Difit uses the same approach successfully
- Export via "Copy Prompt" is the primary output mechanism

### Why no caching?
- Repositories change outside givy (user runs git commands independently)
- Showing stale data would be confusing
- Git operations on local repos are fast enough
