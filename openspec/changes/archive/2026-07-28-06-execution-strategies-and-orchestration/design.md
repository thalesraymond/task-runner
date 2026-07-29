## Context

The Go port of `task-runner` has basic task execution capabilities but lacks advanced task execution strategies (e.g. retries) and a centralized orchestrator (`TaskRunner`). The TypeScript version uses these to handle intermittent failures and configure entire task runs elegantly. We need to implement a developer-friendly API in Go for these features, adhering to idiomatic Go patterns.

## Goals / Non-Goals

**Goals:**
- Implement an `ExecutionStrategy` interface that wraps `Task.Run`.
- Implement `StandardStrategy`, `RetryStrategy`, and `DryRunStrategy`.
- Implement a `TaskRunner` orchestrator.
- Use the Functional Options pattern for `TaskRunner` configuration (e.g., `WithConcurrency`, `WithPlugin`).
- Use standard Go libraries (`context`, `time`) to handle backoff and cancellation.

**Non-Goals:**
- Advanced dependency resolution graph processing (assuming it is handled elsewhere or simplified for this stage).
- Dynamic scaling of workers across multiple machines.

## Decisions

- **ExecutionStrategy Interface**: A simple interface `type ExecutionStrategy interface { Execute(ctx context.Context, task *Task) error }` or similar, potentially as a function type `type ExecutionStrategy func(context.Context, *Task) error` for simpler decorator implementation. The user suggested interface that wraps `Task.Run` call.
- **Decorator Pattern for Strategies**: Strategies like `RetryStrategy` can wrap another strategy (usually the standard one) to add behavior without modifying the core task logic.
- **Functional Options for TaskRunner**: Using functional options (`type TaskRunnerOption func(*TaskRunner)`) makes configuration extensible and readable, matching idiomatic Go. Example: `NewTaskRunner(ctx context.Context, options ...TaskRunnerOption) *TaskRunner`.
- **Retries with time.Sleep**: `time.Sleep` and `context.Context` will be used to implement retries and backoff.

## Risks / Trade-offs

- **Risk**: Retries might cause the entire task run to hang if context timeouts are not properly configured.
  - **Mitigation**: Ensure the context passed to the task and the sleep operation is respected.
- **Trade-off**: Decorator pattern versus configuration on the task level. We will use decorators for clear separation of concerns.
