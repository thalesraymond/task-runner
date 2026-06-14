## Why

Currently, we have automated releases and npm uploads configured using `release-please` for the TypeScript (`ts/`) project, but the Go (`go/`) project lacks automated release management. To provide a consistent versioning and changelog generation experience across the entire repository, we need to extend our `release-please` setup to support the Go project with local releases and tags, managing two independent PRs (one for `ts` and one for `go`).

## What Changes

- Update `release-please-config.json` to include the `go` package, configuring it as a standard release type (e.g., `go`) to create GitHub releases and tags without publishing to a registry.
- Initialize the `go` package version in `.release-please-manifest.json`.
- Modify the `.github/workflows/release-please.yml` GitHub Actions workflow to support both projects seamlessly.
- The `go` release will create the appropriate Git tag and GitHub release.

## Capabilities

### New Capabilities
- `go-release-automation`: Automates semantic versioning, changelog generation, and GitHub release creation for the Go codebase within the monorepo.

### Modified Capabilities


## Impact

- **Affected Code/Configs**: `release-please-config.json`, `.release-please-manifest.json`, `.github/workflows/release-please.yml`.
- **Systems**: GitHub Actions will now generate release PRs and corresponding tags for both the `ts` and `go` packages based on standard release-please monorepo configurations.
