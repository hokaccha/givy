# Release

## How to release

1. Create and push a version tag:

```bash
git tag v1.0.0
git push origin v1.0.0
```

2. The GitHub Actions workflow (`.github/workflows/release.yml`) runs automatically on `v*` tags.

3. The workflow builds cross-platform binaries and creates a GitHub Release with auto-generated release notes.

## What happens in CI

- Builds the frontend (`pnpm build`)
- Cross-compiles Go binaries for the following targets:
  - `linux/amd64`
  - `linux/arm64`
  - `darwin/amd64`
  - `darwin/arm64`
- Embeds the tag name as the version (`givy --version`)
- Packages each binary as a `.tar.gz` archive
- Creates a GitHub Release with the archives attached

## Versioning

Version strings follow [Semantic Versioning](https://semver.org/) with a `v` prefix (e.g., `v1.2.3`).

The version is injected at build time via `-ldflags`:

```bash
go build -ldflags "-X github.com/hokaccha/givy/cmd.Version=v1.2.3" -o givy .
```

For local builds, pass `VERSION` to make:

```bash
make build VERSION=v1.2.3
```

Without `VERSION`, the binary reports `dev` as its version.
