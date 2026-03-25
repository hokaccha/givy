# Test Plan

## Philosophy

Tests are written before implementation. Each feature is considered done only when
all related tests pass. E2E tests are the primary quality gate for user-facing behavior.

## Test Layers

### 1. Go Unit Tests (`go test ./...`)

Located alongside source files in `internal/git/` and `internal/handler/`.

#### `internal/git/` — Git operation parsing

| Test File | What It Tests |
|-----------|--------------|
| `repo_test.go` | Repository discovery: finds `owner/repo/.git` dirs, ignores non-repos |
| `tree_test.go` | `ls-tree` output parsing: files, dirs, sizes, modes |
| `branch_test.go` | Branch listing parsing, default branch detection |
| `diff_test.go` | Unified diff output parsing into structured file/hunk data |
| `git_test.go` | Command execution helper, error wrapping, timeout handling |

Each test uses a real temporary git repository created by `testutil.CreateTestRepo()`.
This function creates a repo with known commits, branches, and file types.

#### `internal/handler/` — API integration tests

| Test | What It Tests |
|------|--------------|
| `GET /api/repos` | Returns list of discovered repos with correct shape |
| `GET /api/repos/:owner/:repo/tree/:ref` | Returns directory entries |
| `GET /api/repos/:owner/:repo/blob/:ref/*path` | Returns file content, detects binary |
| `GET /api/repos/:owner/:repo/branches` | Returns branch list |
| `GET /api/repos/:owner/:repo/compare/:base...:head` | Returns structured diff |
| Error cases | 404 for missing repos/files, 400 for invalid refs |

Tests use `httptest.NewServer` with a real test git repo.

### 2. Frontend Unit Tests (Vitest)

Located in `frontend/src/__tests__/`.

| Test File | What It Tests |
|-----------|--------------|
| `diff-parser.test.ts` | Parse unified diff text → structured hunks with line numbers |
| `comments.test.ts` | Comment CRUD: create, read, update, delete in localStorage |
| `comments.test.ts` | Comment key generation from repo/diff identifiers |
| `comments.test.ts` | Prompt formatting (single file, all files) |

### 3. E2E Tests (Playwright) — Primary quality gate

Located in `frontend/e2e/`.

**Setup**: Playwright's `webServer` config starts givy with a test fixture repo.
Test fixture repos are created by `frontend/e2e/fixtures/setup-repos.sh`.

#### Test Suites

**`repo-list.spec.ts`** — Repository listing
- Shows all repos with owner/name
- Clicking a repo navigates to its tree view
- Shows empty state when directory has no repos

**`file-tree.spec.ts`** — File browsing
- Root directory shows files and subdirectories
- Clicking directory navigates deeper
- Shows file type icons (folder, file)
- Breadcrumb shows current path
- Breadcrumb links navigate correctly
- Branch selector dropdown lists branches
- Switching branch updates the tree

**`file-viewer.spec.ts`** — File viewing
- Markdown file renders as formatted HTML
- Markdown supports GFM (tables, task lists, code blocks)
- Code file shows syntax-highlighted content
- Code file shows line numbers
- Image file displays inline
- Binary file shows download/info message

**`diff-view.spec.ts`** — Diff/compare view
- Shows list of changed files with +/- stats
- Default mode shows split diff
- Can toggle to unified diff
- Diff shows correct line numbers
- Added lines highlighted in green
- Removed lines highlighted in red
- Can click on a file to jump to its diff

**`review-comments.spec.ts`** — Review/comment system
- Clicking line gutter opens comment form
- Typing and submitting creates a comment
- Comment appears in the diff at the correct location
- Comment persists after page reload (localStorage)
- Can edit an existing comment
- Can delete a comment
- Can select a range of lines (shift+click or drag)
- Range comment displays across all selected lines
- "Copy Prompt" copies formatted text for one file
- "Copy All Prompt" copies formatted text for all files
- Copied prompt includes file path, line numbers, diff context, and comment text

## Test Fixture Repository

The test fixture script (`frontend/e2e/fixtures/setup-repos.sh`) creates:

```
<tmp_dir>/
  testowner/
    testrepo/
      .git/
      README.md          (markdown content with GFM features)
      src/
        main.go          (Go source code)
        utils.go         (Go source code)
      docs/
        guide.md         (markdown)
      assets/
        logo.png         (small PNG image)
      data.bin           (binary file)
```

With branches:
- `main` — all files above
- `feature/add-tests` — adds `src/main_test.go`, modifies `src/main.go`

This gives us test data for all scenarios: markdown, code, image, binary,
directory navigation, and branch comparison.

## Running Tests

```bash
# All tests
make test-all

# Individual layers
make test            # Go unit + integration
make test-frontend   # Vitest
make test-e2e        # Playwright

# Watch mode (development)
cd frontend && pnpm test -- --watch
```
