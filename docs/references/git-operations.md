# Git Operations Reference

All git operations use `exec.Command("git", ...)` with `-C <repo_path>` to set
the working directory. This document lists every git command used and its expected output.

## Repository Discovery

Not a git command. Scan the root directory for `<owner>/<repo>/.git` directories.

## Default Branch

```bash
git -C <repo> symbolic-ref refs/remotes/origin/HEAD
# Output: refs/remotes/origin/main
# Fallback: check if "main" exists, then "master"
```

## List Branches

```bash
git -C <repo> branch --format='%(refname:short) %(objectname:short)'
# Output (one per line):
# main abc1234
# feature/review def5678
```

## List Tree (Directory Contents)

```bash
git -C <repo> ls-tree -l <ref> -- <path>
# Output (tab-separated):
# 100644 blob abc1234    1234	src/main.go
# 040000 tree def5678       -	src/internal
```

Fields: mode, type, hash, size (- for trees), name

## Read File Content

```bash
git -C <repo> show <ref>:<path>
# Output: raw file content (binary or text)
```

## Check if File is Binary

```bash
git -C <repo> diff --numstat 4b825dc642cb6eb9a060e54bf899d69f82a3af3 <ref> -- <path>
# Output for binary: -	-	<path>
# Output for text:   10	0	<path>
```

The hash `4b825dc642cb6eb9a060e54bf899d69f82a3af3` is the empty tree.

## Generate Diff

```bash
git -C <repo> diff <base>...<head>
# Output: standard unified diff
```

## Diff Stats

```bash
git -C <repo> diff --stat <base>...<head>
# Output:
#  src/main.go | 10 ++++---
#  2 files changed, 7 insertions(+), 3 deletions(-)
```

## Diff with Numstat

```bash
git -C <repo> diff --numstat <base>...<head>
# Output (tab-separated):
# 7	3	src/main.go
```

## Last Commit for Path

```bash
git -C <repo> log -1 --format='%H %s %aI' -- <path>
# Output: abc1234def5678... Fix the bug 2025-01-15T10:30:00+09:00
```
