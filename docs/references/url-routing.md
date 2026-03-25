# URL Routing Reference

## Frontend Routes

| URL Pattern | Page Component | Description |
|-------------|---------------|-------------|
| `/` | RepoList | List all repositories |
| `/:owner/:repo` | TreeView | Repository root (directory listing) |
| `/:owner/:repo/tree/*` | TreeView | Subdirectory listing |
| `/:owner/:repo/blob/*` | BlobView | File content viewer |
| `/:owner/:repo/compare/:spec` | CompareView | Diff between two refs |

## URL Examples

```
/                                          → Repository list
/hokaccha/givy                             → Root directory listing
/hokaccha/givy/tree/internal/git           → Subdirectory listing
/hokaccha/givy/blob/README.md              → File viewer
/hokaccha/givy/compare/main...feature/review → Diff view
```

## Design Decision: Filesystem-Based Browsing

File tree and blob views use the **actual filesystem** (not git objects).
This means:
- No branch/ref in browse URLs — always shows the working directory state
- Branch selector is only used in the compare/diff view
- Uncommitted changes are visible in the file browser
- `.git` directory is automatically hidden

## Review Flow

Users reach the compare/review view in two ways:

1. **Web UI**: On the repo root page (`/:owner/:repo`), a ReviewLauncher
   component shows base/head branch selectors. Clicking "Compare" navigates
   to `/:owner/:repo/compare/base...head`.

2. **CLI**: `givy review [spec]` opens the compare view in the browser.
   - `givy review` — current branch vs default branch
   - `givy review feature/x` — feature/x vs default branch
   - `givy review main...feature/x` — explicit base and head

## API Routes

All API routes are prefixed with `/api/`. See [api.md](api.md) for details.
Non-API routes serve the embedded SPA with fallback to `index.html`.
