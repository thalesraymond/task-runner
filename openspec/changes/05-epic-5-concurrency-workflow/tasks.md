## 1. Setup Go Executor Skeleton

- [ ] 1.1 Create `go/internal/runner/executor.go` defining the `WorkflowExecutor` struct.
- [ ] 1.2 Define the struct dependencies, including `TaskStateManager` and concurrency limit configuration.

## 2. Core Execution Loop

- [ ] 2.1 Implement the `Execute(ctx context.Context)` method skeleton.
- [ ] 2.2 Initialize the semaphore using a buffered channel of size `maxConcurrentTasks`.
- [ ] 2.3 Implement the `select` block to handle task readiness, completion results from a results channel, and cancellation via `ctx.Done()`.

## 3. Task Dispatching

- [ ] 3.1 Implement the goroutine launch logic for newly ready tasks.
- [ ] 3.2 Thread the parent `context.Context` down into individual task execution.
- [ ] 3.3 Ensure each spawned goroutine sends its outcome (success or error) to the executor's results channel upon completion.
- [ ] 3.4 Ensure the semaphore slot is released precisely when the task goroutine finishes.

## 4. Integration and Testing

- [ ] 4.1 Wire the new `WorkflowExecutor` into the main application flow (e.g., in `go/cmd/task-runner/main.go`).
- [ ] 4.2 Write unit tests verifying that concurrency limits are strictly respected.
- [ ] 4.3 Write unit tests verifying graceful shutdown and immediate exit on context cancellation.
