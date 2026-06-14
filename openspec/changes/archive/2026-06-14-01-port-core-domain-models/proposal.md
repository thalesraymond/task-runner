## Why

The task runner engine needs a robust, statically typed foundation in Go to support the entire workflow execution architecture. Moving from TypeScript's generic interfaces and `AbortSignal` requires establishing a natively idiomatic Go equivalent leveraging Go 1.18+ Generics for shared state and `context.Context` for standard, robust cancellation and timeout propagation. This establishes the fundamental building blocks (Task, TaskResult, TaskStatus) for the entire Go port.

## What Changes

- Define the core `Task` interface utilizing Go Generics (`TContext any`) to safely pass shared state.
- Replace `AbortSignal` with Go's native `context.Context` for the primary mechanism of handling cancellation, timeouts, and deadlines.
- Define the `TaskResult` struct and a custom `TaskStatus` enumeration (e.g., using `iota` constants) to accurately reflect success, failure, skipping, and cancellation states.

## Capabilities

### New Capabilities
- `go-core-domain-models`: Core domain definitions in Go including the `Task` interface with `context.Context`, `TaskResult`, and `TaskStatus`.

### Modified Capabilities


## Impact

- Go Core: This is the foundation of the Go implementation; all future components (like the WorkflowExecutor and TaskStateManager) will depend heavily on these interfaces.
- Portability: Developers writing custom tasks in Go will implement this `Task` interface directly.
