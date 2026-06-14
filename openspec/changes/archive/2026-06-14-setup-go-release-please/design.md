## Context

The repository currently automates releases for the TypeScript (`ts/`) project using the `release-please-action`. This reads conventional commits, creates a release pull request with an updated changelog, and upon merge, creates a GitHub release and publishes to npm. The Go (`go/`) project currently lacks this automation. Because Go modules are versioned directly via Git tags (e.g., `go/v1.2.3`), we need `release-please` to manage versioning and tagging for the Go project independently of the TS project.

## Goals / Non-Goals

**Goals:**
- Automate version bumping, changelog generation, and GitHub release PR creation for the Go codebase using `release-please`.
- Manage two separate release streams (PRs and tags) within the monorepo: one for `ts` and one for `go`.
- Ensure standard Go module compatibility via Git tags.

**Non-Goals:**
- Publishing the Go binary or module to any external package registry (Go modules are consumed directly from version control).
- Building binaries as part of the release process (this focuses only on the tagging and changelog aspect for now).

## Decisions

- **Release Type**: We will use the `go` release type in `release-please-config.json` for the `go` directory. This is the standard way to configure Go modules in `release-please`. It ensures the `go/vX.Y.Z` tag format is generated properly (or whatever is standard for a monorepo Go package, typically `<package-name>-v<version>`).
- **Workflow Updates**: We will modify the existing `.github/workflows/release-please.yml` to support the monorepo scenario. When `release-please` is configured with multiple packages, its outputs change slightly (e.g., `<package>--release_created`). We need to ensure that the `ts` publish steps only run if the `ts` release was created, and similarly for `go` (if any extra steps are ever added, though currently none are needed).

## Risks / Trade-offs

- **Risk: Tag format conflicts or misconfiguration**: Monorepo Go modules require specific tag formats (e.g., `<path>/vX.Y.Z`) for `go get` to work properly. `release-please` handles this via the `package-name` in configuration, but we must ensure it's set correctly.
  - *Mitigation*: Configure the `go` package in `release-please-config.json` with the appropriate path.
- **Risk: Broken workflow conditionally running `ts` publish**: Since `release-please` will now manage two packages, the output `steps.release.outputs.release_created` might not be enough. We will need to check the specific package output (e.g., `steps.release.outputs['ts--release_created']`).
  - *Mitigation*: Update the `if` conditions in the workflow to check for the `ts` package release specifically.
