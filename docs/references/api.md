# API Reference

All endpoints return JSON. Non-API routes serve the embedded SPA.

## Server Info

### `GET /api/info`

Get server configuration info.

**Response:**
```json
{
  "rootDir": "/path/to/repos"
}
```

## Repositories

### `GET /api/repos?q=<query>`

Search repositories. Returns repos whose `owner/name` contains the query
(case-insensitive). If `q` is omitted or empty, returns all repositories.
Use `limit` to cap the number of results (e.g., `?limit=20`).

**Response:**
```json
[
  {
    "owner": "hokaccha",
    "name": "givy"
  }
]
```

### `GET /api/repos/:owner/:repo`

Get repository metadata.

**Response:**
```json
{
  "owner": "hokaccha",
  "name": "givy",
  "defaultBranch": "main"
}
```

## Branches

### `GET /api/repos/:owner/:repo/branches`

List all branches. Used for diff/compare features.

**Response:**
```json
[
  {
    "name": "main",
    "isDefault": true,
    "lastCommit": "abc1234"
  },
  {
    "name": "feature/review",
    "isDefault": false,
    "lastCommit": "def5678"
  }
]
```

## File Tree (filesystem-based)

### `GET /api/repos/:owner/:repo/tree`
### `GET /api/repos/:owner/:repo/tree/*path`

List entries in a directory using the actual filesystem (not git objects).
`path` is optional (defaults to repository root). Skips `.git` directory.

**Response:**
```json
{
  "path": "src",
  "entries": [
    {
      "name": "main.go",
      "type": "blob",
      "mode": "0644",
      "size": 1234
    },
    {
      "name": "internal",
      "type": "tree",
      "mode": "0755",
      "size": 0
    }
  ]
}
```

## File Content (filesystem-based)

### `GET /api/repos/:owner/:repo/blob/*path`

Get file content from the actual filesystem (not git objects).

**Response (text):**
```json
{
  "path": "src/main.go",
  "name": "main.go",
  "content": "package main\n\nfunc main() {...}",
  "size": 1234,
  "isBinary": false,
  "encoding": ""
}
```

**Response (binary):**
```json
{
  "path": "assets/logo.png",
  "name": "logo.png",
  "content": "<base64 encoded>",
  "encoding": "base64",
  "size": 5678,
  "isBinary": true
}
```

## Compare / Diff

### `GET /api/repos/:owner/:repo/compare/:base...:head`

Get diff between two refs (branches, commits). This is the only endpoint
that uses git objects rather than the filesystem.

**Response:**
```json
{
  "base": "main",
  "head": "feature/review",
  "files": [
    {
      "path": "src/handler.go",
      "status": "modified",
      "additions": 10,
      "deletions": 3,
      "patch": "unified diff text..."
    }
  ],
  "stats": {
    "files": 3,
    "additions": 25,
    "deletions": 8
  }
}
```

## Error Responses

All errors return:
```json
{
  "error": "human-readable error message"
}
```

| Status | Meaning |
|--------|---------|
| 400 | Bad request (malformed path) |
| 404 | Repository, branch, or file not found |
| 500 | Internal error (git command failed) |
