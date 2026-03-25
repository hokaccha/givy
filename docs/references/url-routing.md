# URL Routing Reference

## Frontend Routes

| URL Pattern | Page Component | Description |
|-------------|---------------|-------------|
| `/` | RepoList | List all repositories |
| `/:owner/:repo` | RepoHome | Redirect to tree view of default branch |
| `/:owner/:repo/tree/:ref/*` | TreeView | Directory listing at ref and path |
| `/:owner/:repo/blob/:ref/*` | BlobView | File content viewer |
| `/:owner/:repo/compare/:base...:head` | CompareView | Diff between two refs |

## URL Examples

```
/                                          → Repository list
/hokaccha/givy                             → Redirect to /hokaccha/givy/tree/main
/hokaccha/givy/tree/main                   → Root tree on main branch
/hokaccha/givy/tree/main/internal/git      → Subdirectory listing
/hokaccha/givy/blob/main/README.md         → File viewer
/hokaccha/givy/tree/feature/review         → Tree on feature branch
/hokaccha/givy/compare/main...feature/review → Diff view
```

## Ref Encoding

Branch names may contain `/` (e.g., `feature/review`). The ref parameter in URLs
captures everything between the route prefix and the remaining path.

Resolution strategy:
1. Try the full remaining path as a ref
2. Progressively split from the right, checking if each prefix is a valid ref
3. First valid ref wins; the rest is the file path

Example: `/hokaccha/givy/tree/feature/review/src/main.go`
- Try ref=`feature/review/src/main.go` → not a branch
- Try ref=`feature/review/src` → not a branch
- Try ref=`feature/review` → valid branch → path=`src/main.go`

## API Routes

All API routes are prefixed with `/api/`. See [api.md](api.md) for details.
Non-API routes serve the embedded SPA with fallback to `index.html`.
