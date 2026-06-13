## ADDED Requirements

### Requirement: Go CI Workflow
The system SHALL have a continuous integration workflow for the Go project that mirrors the checks in the TypeScript implementation. This includes building, testing, linting, codecov reporting, and SonarQube scanning on push and pull request to the `main` branch.

#### Scenario: Successful build and test
- **WHEN** a developer pushes code to the `main` branch or opens a pull request targeting `main`
- **THEN** the GitHub Actions CI workflow triggers.
- **THEN** the pipeline successfully checks out the code, sets up Go 1.23, and runs `go build ./...` and `go test -coverprofile=coverage.out ./...`.
- **THEN** the pipeline runs `go vet ./...`.
- **THEN** coverage is uploaded to Codecov successfully.
- **THEN** SonarQube scanning is executed on the codebase successfully.
