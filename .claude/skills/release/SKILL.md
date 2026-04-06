---
name: release
description: Create a new version release for givy. Use when the user says "release", "tag", "version bump", or wants to publish a new version. Handles tagging, pushing, and monitoring the GitHub Actions release workflow.
allowed-tools: Bash(git *), Bash(gh *)
argument-hint: "<major|minor|patch|vX.Y.Z>"
---

# Release Skill

Create a tagged release for givy. Pushing a version tag triggers the GitHub Actions release workflow, which cross-builds binaries and publishes a GitHub Release.

## Steps

1. **Determine version**:
   - Get the latest tag: `git tag --sort=-v:refname | head -1`
   - If the argument is `major`, `minor`, or `patch`, bump the corresponding component of the latest tag:
     - `major`: `v1.2.3` → `v2.0.0`
     - `minor`: `v1.2.3` → `v1.3.0`
     - `patch`: `v1.2.3` → `v1.2.4`
   - If the argument is an explicit version (e.g. `v0.5.0`), use it as-is.
   - If no argument is provided, show the latest tag and ask the user which bump level they want.

2. **Pre-flight checks**:
   - Verify the working tree is clean (`git status --porcelain`). If not, warn the user and stop.
   - Verify the current branch is `main`. Releases should only be tagged on main.
   - List commits since the last tag: `git log <last-tag>..HEAD --oneline`. Show them to the user as a summary of what's included.
   - Show the computed new version and ask for confirmation before proceeding.

3. **Tag and push**:
   - Create the tag: `git tag <version>`
   - Push the branch and tag: `git push origin main && git push origin <version>`

4. **Monitor**: Check the release workflow status with `gh run list --workflow=release.yml --limit=1`. Report the run URL so the user can track it.

## Examples

```
User: /release patch
→ git tag --sort=-v:refname | head -1  (latest: v0.3.0)
→ New version: v0.3.1
→ git status --porcelain  (clean)
→ git log v0.3.0..HEAD --oneline  (show commits)
→ Confirm with user
→ git tag v0.3.1
→ git push origin main && git push origin v0.3.1
→ gh run list --workflow=release.yml --limit=1
```

```
User: /release minor
→ git tag --sort=-v:refname | head -1  (latest: v0.3.0)
→ New version: v0.4.0
→ ...
```

```
User: /release v1.0.0
→ Explicit version: v1.0.0
→ ...
```
