# task-runner (Go)

This directory contains the Go implementation of `task-runner` — a rewrite of the TypeScript project at [`../ts/`](../ts/).

> **Status:** Scaffolding. Implementation is in progress.

## Overview

`task-runner` is a lightweight, domain-agnostic task orchestration engine. It resolves a Directed Acyclic Graph (DAG) of steps, executes independent tasks in parallel, manages a shared context across the pipeline, and supports cancellation via standard `context.Context`.

## Project Layout

```
go/
├── cmd/
│   └── task-runner/    # Binary entry point
│       └── main.go
├── internal/
│   └── runner/         # Core orchestration logic (private)
│       └── runner.go
├── go.mod
└── README.md
```

## Requirements

- [Go 1.23+](https://go.dev/dl/)

## Commands

```bash
# Build the binary
go build ./...

# Run all tests
go test ./...

# Vet for common issues
go vet ./...

# Run the binary
go run ./cmd/task-runner
```

## Relationship to TypeScript Implementation

The TypeScript implementation lives in [`../ts/`](../ts/) and is the current stable, published version (`@calmo/task-runner` on npm). The Go implementation is being developed in parallel as a full rewrite, targeting feature parity before the TypeScript version is deprecated.
