## Why

The Go port of the task-runner currently lacks the advanced execution strategies and orchestration capabilities that are present in the TypeScript version. Introducing execution strategies (Standard, Retrying, DryRun) and a central orchestrator (`TaskRunner`) is essential to allow complex task execution configurations in a developer-friendly, idiomatic Go manner.

## What Changes

- Introduce `ExecutionStrategy` interface in Go to wrap `Task.Run` calls.
- Implement specific execution strategies: Standard, Retrying (with backoff leveraging `time.Sleep` and `context`), and DryRun.
- Implement the `TaskRunner` orchestrator to manage and execute task graphs.
- Introduce an idiomatic configuration pattern for `TaskRunner` using the Functional Options pattern (e.g., `NewTaskRunner(ctx, WithConcurrency(5), WithPlugin(myPlugin))`).

## Capabilities

### New Capabilities
- `execution-strategies`: Provides various execution modes (Standard, Retrying, DryRun) by wrapping task execution.
- `task-orchestrator`: Provides a central orchestrator (`TaskRunner`) with functional options to configure and run task graphs.

### Modified Capabilities
- None

## Impact

- **Affected Code**: Introduces new packages/structs in the `go/internal/runner` module.
- **APIs**: Exposes a new developer API (`TaskRunner`, `ExecutionStrategy`, Functional Options) for building and running tasks.
- **Dependencies**: Uses standard Go library (`context`, `time`) without new external dependencies.
