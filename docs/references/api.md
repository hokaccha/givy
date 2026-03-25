# API Reference

All endpoints return JSON. Non-API routes serve the embedded SPA.

## Repositories

### `GET /api/repos`

List all repositories found in the served directory.

**Response:**
```json
[
  {
    "owner": "hokaccha",
    "name": "givy",
    "defaultBranch": "main",
    "updatedAt": "2025-01-15T10:30:00Z"
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

List all branches.

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

## File Tree

### `GET /api/repos/:owner/:repo/tree/:ref/*path`

List entries in a directory. `path` is optional (defaults to root).

**Response:**
```json
{
  "ref": "main",
  "path": "src",
  "entries": [
    {
      "name": "main.go",
      "type": "blob",
      "mode": "100644",
      "size": 1234
    },
    {
      "name": "internal",
      "type": "tree",
      "mode": "040000",
      "size": 0
    }
  ]
}
```

## File Content

### `GET /api/repos/:owner/:repo/blob/:ref/*path`

Get file content.

**Response (text):**
```json
{
  "ref": "main",
  "path": "src/main.go",
  "name": "main.go",
  "content": "package main\n\nfunc main() {...}",
  "size": 1234,
  "isBinary": false,
  "language": "go"
}
```

**Response (binary):**
```json
{
  "ref": "main",
  "path": "assets/logo.png",
  "name": "logo.png",
  "content": "<base64 encoded>",
  "encoding": "base64",
  "size": 5678,
  "isBinary": true,
  "language": ""
}
```

## Compare / Diff

### `GET /api/repos/:owner/:repo/compare/:base...:head`

Get diff between two refs.

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
| 400 | Bad request (invalid ref, malformed path) |
| 404 | Repository, branch, or file not found |
| 500 | Internal error (git command failed) |
