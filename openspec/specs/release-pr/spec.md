# release-pr Specification

## Purpose
TBD - created by archiving change adopt-release-pr. Update Purpose after archive.
## Requirements
### Requirement: Release PR Generation
The system MUST automatically maintain a "Release PR" that targets the `main` branch. This PR must accumulate all conventional changes since the last release, calculating the next semantic version and generating a corresponding changelog entry.

#### Scenario: Feature commit triggers PR update
Given the latest release is `v1.0.0`
And a developer merges a commit with message `feat: add awesome feature` to `main`
Then the system should create or update the Release PR
And the PR title should be `chore: release 1.1.0`
And the PR body should contain the changelog entry for "add awesome feature"
And the `package.json` version in the PR should be `1.1.0`

#### Scenario: Fix commit triggers patch update
Given the latest release is `v1.0.0`
And a developer merges a commit `fix: urgent bug` to `main`
Then the Release PR should be updated to target version `1.0.1`

### Requirement: Release Publication
The system MUST execute the release process (git tag, GitHub Release, npm publish) ONLY when the Release PR is merged into `main`.

#### Scenario: Merge triggers publish
Given the Release PR for `v1.1.0` exists
When a maintainer merges the PR into `main`
Then the system should create a GitHub Release `v1.1.0`
And the system should publish the package to the configured registry (NPM)
And the system should NOT publish any other commits merged to `main` until the next Release PR merge

