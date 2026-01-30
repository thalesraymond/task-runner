# Proposal: Adopt Release PR Pattern

## Goal

Switch from "continuous deployment on every commit" to the **Release PR Pattern** (Google Style) using [Release Please](https://github.com/google-github-actions/release-please-action).
This ensures that releases are batched, version explosion is prevented, and human control is restored via PR merges, while maintaining automation.

## User Review Required

> [!IMPORTANT]
> This is a breaking change to the release process.
>
> - **Current Behavior**: Every commit to `main` triggers a release/publish.
> - **New Behavior**: Commits to `main` update a "Release PR". A release only happens when you **merge** that PR.

## Proposed Changes

### Configuration

#### [DELETE] [.releaserc.json](file:///home/thales/projects/task-runner/.releaserc.json)

- Remove Semantic Release configuration.

#### [NEW] [release-please-config.json](file:///home/thales/projects/task-runner/release-please-config.json)

- Configuration for Release Please (monorepo-friendly structure, standard conventional commits).

#### [NEW] [.release-please-manifest.json](file:///home/thales/projects/task-runner/.release-please-manifest.json)

- Tracks versions (required for Release Please).

### Infra / CI

#### [DELETE] [.github/workflows/release.yml](file:///home/thales/projects/task-runner/.github/workflows/release.yml)

- Remove successful `semantic-release` workflow.

#### [NEW] [.github/workflows/release-please.yml](file:///home/thales/projects/task-runner/.github/workflows/release-please.yml)

- New GitHub Action workflow that:
  1. Runs `release-please` to update the PR.
  2. If a release is created (PR merged), runs build/publish steps.

## Verification Plan

### Automated Tests

- **Dry Run**: We cannot easily "test" the GitHub Action without merging, but we can verify the configuration files are valid JSON.
- **Lint**: Ensure new workflow file syntax is valid (tools like `action-validator` if available, otherwise manual review).

### Manual Verification

- **Post-Merge**:
  1. Push a `fix: test` commit to `main`.
  2. Verify `release-please` bot creates a PR "chore: release 1.0.1".
  3. Push another `feat: cool` commit.
  4. Verify PR updates to includes the feature.
  5. Merge the PR.
  6. Verify GitHub Release created and NPM publish (if configured).
