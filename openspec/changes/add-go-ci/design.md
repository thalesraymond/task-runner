## Context

The repository contains two implementations of a task runner: TypeScript and Go. While the TypeScript implementation has a robust GitHub Actions CI pipeline (`ci.yml`), the Go implementation does not. Adding a corresponding CI pipeline for Go ensures consistent code quality, testing, and continuous feedback.

## Goals / Non-Goals

**Goals:**
- Implement a GitHub Actions workflow that executes `go build ./...`, `go test ./...`, and `go vet ./...`.
- Upload test coverage results to Codecov using `go test -coverprofile=coverage.out ./...`.
- Perform SonarQube scanning on the Go codebase.
- Trigger these checks on pushes and pull requests to the `main` branch.

**Non-Goals:**
- We are not modifying the existing TypeScript CI workflow.
- We are not setting up release automation for the Go project in this change.
- We are not changing the structure or contents of the `go/` directory beyond CI checks.

## Decisions

- **GitHub Actions:** Chosen as it is already the standard for the TypeScript project in this repository.
- **Workflow Name & Trigger:** The workflow will be named `Go CI` and triggered on `push: branches: [main]` and `pull_request: branches: [main]` to match the TS CI.
- **Go Version:** `1.23+` (specifically using `1.23` in `actions/setup-go`) as defined in project rules.
- **Codecov & SonarQube:** Re-use the existing repository secrets (`CODECOV_TOKEN` and `SONAR_TOKEN`) to upload reports to the existing Codecov and SonarQube projects.
- **Working Directory:** All steps will be executed with a default working directory of `go`, or specify `working-directory: go` for steps where applicable.

## Risks / Trade-offs

- [Risk] Go tests might fail in CI due to environment differences. → Mitigation: We will use a standard `ubuntu-latest` runner with a cleanly setup Go 1.23 environment.
- [Risk] SonarQube scanning might require specific configuration for Go. → Mitigation: We'll ensure the `projectBaseDir` or `sonar.projectKey` is correctly set, though pointing it to the root or `go/` directory with `sonar.sources=go/` will likely be necessary if it's a monorepo.
