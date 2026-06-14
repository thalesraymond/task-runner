# Proposal

## Context

The repository contains two implementations of a task runner: a stable TypeScript implementation (`ts/`) and an active Go implementation in development (`go/`). The TypeScript project already has a CI pipeline configured using GitHub Actions (`ci.yml`) that runs builds, tests, linting, codecov reporting, and SonarQube scans. Currently, the Go implementation lacks a continuous integration pipeline, which may lead to integration issues and lack of code quality tracking.

## Problem Statement

The Go implementation does not have automated verification. To maintain the same level of quality and consistency across both codebases, we need to implement a continuous integration pipeline for the Go project that mirrors the TS project's CI steps.

## Proposed Solution

Create a new GitHub Actions workflow file (`.github/workflows/go-ci.yml`) that triggers on pushes and pull requests to the `main` branch. 
This workflow will:
1. Checkout the repository.
2. Setup the Go environment (Go 1.23+ based on project guidelines).
3. Build the Go project (`cd go && go build ./...`).
4. Run Go tests with coverage profiling (`cd go && go test -coverprofile=coverage.out ./...`).
5. Run linting (`cd go && go vet ./...` and potentially `golangci-lint` if desired, though `go vet` is explicitly listed in project commands).
6. Upload the test coverage report to Codecov.
7. Run SonarQube scan for the Go codebase.
