# URL Routing Reference

## Frontend Routes

| URL Pattern | Page Component | Description |
|-------------|---------------|-------------|
| `/` | RepoList | List all repositories |
| `/:owner/:repo` | TreeView | Repository root (directory listing) |
| `/:owner/:repo/tree/*` | TreeView | Subdirectory listing |
| `/:owner/:repo/blob/*` | BlobView | File content viewer |
| `/:owner/:repo/changes/*` | ChangesView | Unified diff view (unstaged/staged/branch) |
| `/:owner/:repo/compare/*` | *(redirect)* | Redirects to `/changes/*` |
| `/:owner/:repo/commit/:commitId` | CommitView | Single commit diff (no review) |
| `/:owner/:repo/commits/:spec` | CommitListView | List commits between two refs |

## URL Examples

```
/                                          → Repository list
/hokaccha/givy                             → Root directory listing
/hokaccha/givy/tree/internal/git           → Subdirectory listing
/hokaccha/givy/blob/README.md              → File viewer
/hokaccha/givy/changes/@unstaged                → Unstaged diff (default)
/hokaccha/givy/changes/@staged                 → Staged diff
/hokaccha/givy/changes/main...feature/review   → Branch comparison diff
/hokaccha/givy/compare/main...feature/review   → Redirects to /changes/...
/hokaccha/givy/commit/abc1234              → Single commit diff
/hokaccha/givy/commits/main...feature/review → Commit list
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

1. **Web UI**: On the repo root page (`/:owner/:repo`), a "View Diff" button
   navigates to `/:owner/:repo/changes`. The changes page has tabs for
   Unstaged, Staged, and Branch comparison with branch selectors.

2. **CLI**: `givy diff [spec]` opens the changes view in the browser.
   - `givy diff` — current branch vs default branch
   - `givy diff feature/x` — feature/x vs default branch
   - `givy diff main...feature/x` — explicit base and head

3. **CLI**: `givy open <commit-id>` opens the commit diff view in the browser.
   - Detects commit hashes (7-40 hex characters) and opens the commit view.

## API Routes

All API routes are prefixed with `/api/`. See [api.md](api.md) for details.
Non-API routes serve the embedded SPA with fallback to `index.html`.
