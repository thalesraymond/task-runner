## Why

The current TypeScript `WorkflowExecutor` uses a complex event loop with Promises and a priority queue to manage concurrency. In the new Go implementation, we have the opportunity to leverage native, powerful concurrency primitives (goroutines and channels) to build a simpler, highly performant, and more readable executor that cleanly handles parallel processing, timeouts, and early exits without the cognitive overhead of Promise chaining.

## What Changes

- Implement a worker-pool or semaphore-channel pattern to enforce configured concurrency limits in Go.
- Create a Go `WorkflowExecutor` that dispatches tasks to goroutines as they become ready via the `TaskStateManager`.
- Use `select` statements to elegantly manage task completion alongside cancellation signals from `context.Context`.

## Capabilities

### New Capabilities
- `go-workflow-executor`: Concurrency and workflow execution management in the Go implementation, utilizing goroutines and channels to respect concurrency limits and handle task lifecycles cleanly.

### Modified Capabilities

## Impact

- `go/internal/runner/`: A new Go-based `WorkflowExecutor` component will be added.
- `go/cmd/task-runner/`: Minor wiring updates to invoke the new executor.
