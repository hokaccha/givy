# Known Issues and Fixes

## chi wildcard route not matching root path (fixed, then superseded)

**Date**: 2026-03-25

**Symptom**: `GET /api/repos/:owner/:repo/tree/:ref` returned 404 when
accessing the repository root (no subpath).

**Root cause**: chi router's wildcard `/*` pattern requires at least one
path segment after the prefix.

**Original fix**: Register both routes — one without wildcard for root
access, and one with wildcard for subpath access.

**Current status**: This issue became moot when file browsing was switched
from git-based (`git ls-tree` with ref parameter) to filesystem-based
(`os.ReadDir` without ref). The same dual-route pattern is still used for
tree endpoints but without the ref segment:

```go
r.Get("/repos/{owner}/{repo}/tree", listTree(rootDir))   // root
r.Get("/repos/{owner}/{repo}/tree/*", listTree(rootDir))  // subpath
```

**Prevention**: When using chi wildcard routes, always register a
non-wildcard variant if the trailing path is optional.
