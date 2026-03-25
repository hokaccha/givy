# Git Operations Reference

All git operations use `exec.Command("git", ...)` with `-C <repo_path>` to set
the working directory. This document lists every git command used and its expected output.

## Repository Discovery

Not a git command. Scan the root directory for `<owner>/<repo>/.git` directories
using `os.ReadDir`. No git commands are invoked.

## Default Branch

```bash
git -C <repo> symbolic-ref refs/remotes/origin/HEAD
# Output: refs/remotes/origin/main
# Fallback: check if "main" exists, then "master"
```

Used by: `ListBranches` (to mark default), `givy review` (to determine base).

## List Branches

```bash
git -C <repo> branch --format='%(refname:short) %(objectname:short)'
# Output (one per line):
# main abc1234
# feature/review def5678
```

## File Tree (Directory Contents)

**Not a git command.** Uses `os.ReadDir` to list directory entries on the
actual filesystem. Skips `.git` directory. Returns name, type (blob/tree),
mode, and size.

Legacy git-based approach (kept for reference, no longer used for browsing):
```bash
git -C <repo> ls-tree -l <ref> -- <path>/
```

## Read File Content

**Not a git command.** Uses `os.ReadFile` to read file content from the
actual filesystem. Binary detection uses byte scanning (null bytes, high
non-UTF-8 ratio). Binary files are base64-encoded in the response.

Legacy git-based approach (kept for reference, no longer used for browsing):
```bash
git -C <repo> show <ref>:<path>
```

## Generate Diff

```bash
git -C <repo> diff <base>...<head>
# Output: standard unified diff
```

## Diff with Numstat

```bash
git -C <repo> diff --numstat <base>...<head>
# Output (tab-separated):
# 7	3	src/main.go
# -	-	binary-file.png  (binary files show - for both)
```
