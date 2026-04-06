---
name: commit
description: Stage and commit current changes with an auto-generated commit message. Use when the user says "commit", wants to save their work, or asks to commit changes. No arguments needed.
allowed-tools: Bash(git *)
---

# Commit Skill

Stage and commit all current changes with a well-crafted commit message.

## Steps

1. **Gather context** (run these in parallel):
   - `git status` to see changed and untracked files
   - `git diff` and `git diff --cached` to see all changes

2. **Check for issues**:
   - If there are no changes (clean working tree), tell the user and stop.
   - Do not stage files that likely contain secrets (`.env`, `credentials.json`, etc.). Warn if found.

3. **Draft commit message**:
   - Follow the commit message style below
   - End with `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>`

## Commit Message Style

- Use the imperative mood (e.g. "Add feature" not "Added feature")
- First line: concise summary of the change, under 72 characters
- Optionally add a blank line and a short body explaining why (not what)
- Capitalize the first word, no trailing period

**Examples:**
```
Add hot reload for markdown preview with ETag-based polling
```
```
Fix breadcrumb navigation for nested directories
```
```
Extract E2E fixture files from heredocs into git-tracked content directory
```

4. **Stage and commit**:
   - Stage specific files by name (avoid `git add -A` or `git add .`)
   - Use a HEREDOC for the commit message to ensure correct formatting:
     ```bash
     git commit -m "$(cat <<'EOF'
     Commit message here.

     Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
     EOF
     )"
     ```

5. **Verify**: Run `git status` after committing to confirm success.

## Important

- Never amend existing commits unless explicitly asked
- Never push to remote unless explicitly asked
- Never use `--no-verify` or skip hooks
- Never use interactive flags (`-i`)
