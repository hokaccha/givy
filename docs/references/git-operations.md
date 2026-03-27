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

## Unstaged Diff (Working Tree vs Index)

```bash
# Diff of tracked files
git -C <repo> diff
# Output: standard unified diff of unstaged changes

# List untracked files (new files not yet staged)
git -C <repo> ls-files --others --exclude-standard
# Output: one file path per line
# These files are read directly and a unified diff patch is generated in code.
```

## Staged Diff (Index vs HEAD)

```bash
git -C <repo> diff --cached
# Output: standard unified diff of staged changes
```

## Diff with Numstat

```bash
git -C <repo> diff --numstat <base>...<head>
git -C <repo> diff --numstat              # unstaged
git -C <repo> diff --numstat --cached     # staged
# Output (tab-separated):
# 7	3	src/main.go
# -	-	binary-file.png  (binary files show - for both)
```

## Show Commit

```bash
git -C <repo> log -1 --format='%H%n%s%n%an%n%aI' <commit-id>
# Output:
# abc123...  (full hash)
# Fix bug in handler  (subject)
# hokaccha  (author name)
# 2025-01-15T10:30:00+09:00  (author date ISO)
```

## Commit Diff

```bash
git -C <repo> diff-tree -p <commit-id>
# Output: standard unified diff for the commit
```

## Commit Numstat

```bash
git -C <repo> diff-tree --numstat -r <commit-id>
# Output (tab-separated, same format as diff --numstat)
```

## List Commits Between Refs

```bash
git -C <repo> log --format='%H%x00%s%x00%an%x00%aI' <base>...<head>
# Output (NUL-separated fields, one commit per line):
# abc123...\0Fix bug\0hokaccha\02025-01-15T10:30:00+09:00
```
