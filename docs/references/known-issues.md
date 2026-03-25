# Known Issues and Fixes

## Tree root route returning 404 (fixed)

**Date**: 2026-03-25

**Symptom**: `GET /api/repos/:owner/:repo/tree/:ref` returned 404 when
accessing the repository root (no subpath). For example,
`/api/repos/ubie-inc/coedo/tree/main` was not found, but
`/api/repos/ubie-inc/coedo/tree/main/src` worked.

**Root cause**: chi router's wildcard `/*` pattern requires at least one
path segment after the prefix. The route
`/repos/{owner}/{repo}/tree/{ref}/*` only matched paths like
`/repos/o/r/tree/main/something`, not `/repos/o/r/tree/main` (no trailing
segment for the wildcard).

**Fix**: Register both routes — one without wildcard for root access, and
one with wildcard for subpath access:

```go
r.Get("/repos/{owner}/{repo}/tree/{ref}", listTree(rootDir))   // root
r.Get("/repos/{owner}/{repo}/tree/{ref}/*", listTree(rootDir)) // subpath
```

**Regression test**: `TestListTree_RootWithoutTrailingSlash` in
`internal/handler/handler_test.go` verifies that accessing the tree root
without a trailing slash returns 200 with entries.

**Prevention**: When using chi wildcard routes, always register a
non-wildcard variant if the trailing path is optional.
