# Project: Task Runner

## Overview

The 'task-runner' project is a polyglot monorepo containing a TypeScript-based task orchestration library (`ts/`) and an in-progress Go rewrite (`go/`). The TypeScript implementation manages and executes tasks with features including task cancellation, pre-execution validation, and concurrency control, providing a robust framework for workflow automation. The Go rewrite targets feature parity with improved performance and static binary distribution.

## Tech Stack

**TypeScript (`ts/`):**
- **Language:** TypeScript 5.9.3
- **Testing:** Vitest 4.0.17
- **Core APIs:** AbortSignal/AbortController (Standard Web APIs for cancellation)
- **Package Manager:** pnpm

**Go (`go/`):**
- **Language:** Go 1.23+
- **Testing:** Standard `testing` package
- **Package Manager:** Go modules (`go.mod`)

## Repository Layout

```text
task-runner/
├── ts/                  # TypeScript implementation (stable, published to npm)
│   ├── src/             # Source code
│   │   ├── EventBus.ts
│   │   ├── TaskGraph.ts
│   │   ├── TaskGraphValidator.ts
│   │   ├── TaskRunner.ts
│   │   ├── WorkflowExecutor.ts
│   │   ├── contracts/   # Interfaces and types
│   │   └── ...
│   ├── tests/           # Test suite
│   ├── package.json
│   ├── tsconfig.json
│   └── vitest.config.ts
├── go/                  # Go implementation (in development)
│   ├── cmd/task-runner/ # Binary entry point
│   ├── internal/runner/ # Core orchestration logic
│   └── go.mod
├── .github/             # CI/CD workflows (scoped to ts/ or go/ as appropriate)
└── openspec/            # Project specifications and change tracking
```

## Architecture

The TypeScript project follows a modular architecture with distinct components:

- `EventBus.ts`: Handles event propagation within the system.
- `TaskGraph.ts`: Represents the structure and dependencies of tasks.
- `TaskGraphValidator.ts`: Ensures the validity of task graphs before execution.
- `TaskRunner.ts`: Orchestrates the execution of tasks.
- `WorkflowExecutor.ts`: Manages the overall workflow.
- `contracts/`: Defines interfaces and types for various components.

The Go project mirrors this decomposition, with `internal/runner/` as the core package and `cmd/task-runner/` as the CLI entry point.

## Conventions

- **Coding Style (TS):** Adheres to standard TypeScript conventions, enforced by ESLint and Prettier.
- **Coding Style (Go):** Standard `gofmt` formatting; idiomatic Go patterns.
- **Commit Messages:** Follows conventional commits enforced by Commitlint.
- **Git Hooks:** Utilizes Husky for pre-commit and commit-msg hooks (runs from `ts/`).
- **Testing (TS):** Uses Vitest for unit and integration testing.
- **Testing (Go):** Standard `go test` with table-driven tests.
- **Atomic Commits:** When working on complex multi-task features, commit after each distinct task, ensuring build, lint, and test success.

## Build/Test/Run Commands

**TypeScript (run from `ts/`):**
- **Install Dependencies:** `cd ts && pnpm install`
- **Build Project:** `cd ts && pnpm build`
- **Run Tests:** `cd ts && pnpm test`
- **Lint Code:** `cd ts && pnpm lint`

**Go (run from `go/`):**
- **Build:** `cd go && go build ./...`
- **Run Tests:** `cd go && go test ./...`
- **Vet:** `cd go && go vet ./...`
