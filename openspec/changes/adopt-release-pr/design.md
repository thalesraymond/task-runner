# Design: Release PR Pattern

## Context
The current system uses `semantic-release` within a GitHub Actions workflow (`release.yml`). This workflow triggers on every push to `main`, executing an immediate release (version bump, changelog, git tag, npm publish, github release). This leads to high frequency "version explosion" in a trunk-based high-velocity environment.

## Solution
We will adopt the **Release PR Pattern** using **Release Please**.

### Architecture
- **Tool**: `googleapis/release-please-action`.
- **Trigger**: Pushes to `main`.
- **Mechanism**:
    1.  **Analysis**: The action analyzes commits since the last tagged version.
    2.  **PR Creation**: It creates (or updates) a special Pull Request containing:
        -   The proposed next version numbers.
        -   The generated CHANGELOG entry.
    3.  **Release**:
        -   When the Release PR is **merged**, the action runs again.
        -   It detects the accidental merge of the release commit.
        -   It creates the GitHub Release and Tags.
        -   It outputs a `release_created` boolean.
    4.  **Publish**:
        -   A downstream step in the same workflow listens for `if: ${{ steps.release.outputs.release_created }}`.
        -   If true, it executes the build and publish commands (e.g., `pnpm publish`).

### Migration Strategy
1.  **Cleanup**: Completely remove `semantic-release` configuration and workflow to prevent dual-release mechanisms or conflicts.
2.  **Configuration**:
    -   `release-please-config.json`: Defines the release type (`node`), packages (for monorepo support, though this is seemingly a single package config, using the root as the package is standard).
    -   `.release-please-manifest.json`: Stores the current version (source of truth for Release Please). We will initialize it with the current version from `package.json`.
3.  **Workflow**:
    -   Replace `.github/workflows/release.yml` with `.github/workflows/release-please.yml`.

### Key Differences
| Feature       | Old (Semantic Release) | New (Release Please)                |
| :------------ | :--------------------- | :---------------------------------- |
| **Trigger**   | Every push to `main`   | Merge of Release PR                 |
| **Changelog** | Generated on commit    | Previewed in PR, committed on merge |
| **Version**   | Bumped on commit       | Bumped in PR, committed on merge    |
| **Control**   | Automated              | Manual approval via Merge           |
