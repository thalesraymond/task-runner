# go-release-automation Specification

## Purpose
TBD - created by archiving change setup-go-release-please. Update Purpose after archive.

## Requirements
### Requirement: Go Codebase Semantic Versioning
The system SHALL automatically determine the next semantic version for the Go codebase based on conventional commits affecting the `go/` directory.

#### Scenario: Conventional commits in go directory
- **WHEN** commits following the conventional commits standard are merged into the main branch and they modify files inside the `go/` directory
- **THEN** a release PR is generated (or updated) with the newly calculated semantic version and changelog updates specific to the `go` package.

### Requirement: Go Module Tagging and Release
The system SHALL create an appropriate Git tag and a GitHub Release for the Go module when its release PR is merged.

#### Scenario: Merging the Go release PR
- **WHEN** the `release-please` PR for the `go` package is merged
- **THEN** a Git tag (e.g., `go/vX.Y.Z`) and a corresponding GitHub Release are created with the generated changelog.
