---
name: release
description: Create a new version release for givy. Use when the user says "release", "tag", "version bump", or wants to publish a new version. Handles tagging, pushing, and monitoring the GitHub Actions release workflow.
allowed-tools: Bash(git *), Bash(gh *)
argument-hint: "<version> (e.g. v0.5.0)"
---

# Release Skill

Create a tagged release for givy. Pushing a version tag triggers the GitHub Actions release workflow, which cross-builds binaries and publishes a GitHub Release.

## Steps

1. **Determine version**: Use the argument as the version tag (e.g. `v0.5.0`). If no version is provided, check the latest tag with `git tag --sort=-v:refname | head -1` and suggest the next minor or patch version.

2. **Pre-flight checks**:
   - Verify the working tree is clean (`git status --porcelain`). If not, warn the user and stop.
   - Verify the current branch is `main`. Releases should only be tagged on main.
   - List commits since the last tag: `git log <last-tag>..HEAD --oneline`. Show them to the user as a summary of what's included.

3. **Tag and push**:
   - Create the tag: `git tag <version>`
   - Push the branch and tag: `git push origin main && git push origin <version>`

4. **Monitor**: Check the release workflow status with `gh run list --workflow=release.yml --limit=1`. Report the run URL so the user can track it.

## Example

```
User: v0.4.0 でリリースして
→ git tag --sort=-v:refname | head -1  (latest: v0.3.0)
→ git status --porcelain  (clean)
→ git log v0.3.0..HEAD --oneline  (show commits)
→ git tag v0.4.0
→ git push origin main && git push origin v0.4.0
→ gh run list --workflow=release.yml --limit=1
```
