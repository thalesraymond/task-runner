## ADDED Requirements

### Requirement: CI workflow runs both test suites

The system SHALL have a GitHub Actions workflow that runs the TypeScript and Go test suites on every push and pull request to the main branch.

#### Scenario: Workflow triggers on push/PR to main

- **WHEN** a push or pull request targets the main branch
- **THEN** the workflow SHALL trigger and run both test suites

#### Scenario: TypeScript tests run with pnpm

- **WHEN** the workflow runs
- **THEN** it SHALL install dependencies with `pnpm install` and run `pnpm test` in the ts/ directory

#### Scenario: Go tests run with go test

- **WHEN** the workflow runs
- **THEN** it SHALL run `go test ./...` in the go/ directory

### Requirement: Workflow reports test results clearly

The workflow SHALL report success or failure based on both test suites passing.

#### Scenario: All tests pass

- **WHEN** both test suites pass
- **THEN** the workflow SHALL complete with a green (success) status

#### Scenario: Any test failure fails the workflow

- **WHEN** either test suite has failures
- **THEN** the workflow SHALL complete with a red (failure) status
