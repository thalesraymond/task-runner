## Context

The TypeScript implementation of the `task-runner` relies on a complex event loop, Promises, and a priority queue to manage task concurrency. As part of Epic 5, we are migrating the `WorkflowExecutor` to Go. Go's native concurrency primitives (goroutines and channels) offer a simpler, more robust, and highly performant alternative for executing parallel workflows.

## Goals / Non-Goals

**Goals:**
- Replace the complex Promise-based logic with an idiomatic Go concurrency model.
- Implement a mechanism to strictly enforce configured concurrency limits (e.g. `maxConcurrentTasks`).
- Gracefully handle task timeouts, early exits, and cancellation via `context.Context`.
- Ensure readable and maintainable executor logic without deep nested callbacks or channels.

**Non-Goals:**
- Modifying the underlying logic of the `TaskStateManager` (it will remain responsible for determining task readiness).
- Adding new workflow execution features outside of concurrency and standard execution lifecycle.
- Changing the public API or configuration file format.

## Decisions

**Decision 1: Concurrency Limiting Mechanism (Worker Pool vs. Semaphore)**
- **Choice:** We will use a Semaphore pattern (a buffered channel `chan struct{}` with a size equal to the concurrency limit).
- **Rationale:** A semaphore channel allows us to spawn a lightweight goroutine for every ready task, but blocks execution until a slot is available. This avoids the complexity of managing fixed worker goroutines and channel fan-out/fan-in logic. Goroutines are cheap in Go, so spinning them up dynamically and letting them wait on a semaphore is idiomatic and clean.
- **Alternatives Considered:** A fixed worker pool (e.g. 5 worker goroutines reading from a shared `tasks` channel). While effective, it adds slightly more boilerplate and can be less dynamic if we want to change concurrency limits on the fly or track per-task lifecycle more granularly from the main loop.

**Decision 2: Cancellation and Timeouts**
- **Choice:** Thread `context.Context` through the executor and all tasks. Use `select` statements inside the main execution loop and worker goroutines to listen for `ctx.Done()`.
- **Rationale:** This is the standard Go way to handle cancellation and timeouts. It integrates perfectly with standard library functions and ensures we don't leak goroutines when a workflow is aborted or times out.

**Decision 3: Task Completion Handling**
- **Choice:** Use an unbuffered `results` channel or a wait group combined with a results channel to collect task outcomes.
- **Rationale:** The main loop will listen on the `results` channel. When a task finishes, it sends its result (success/failure) to the channel. The loop then updates the `TaskStateManager` and checks for newly ready tasks to dispatch.

## Risks / Trade-offs

- **[Risk] Goroutine Leaks on Early Exit:** If a task blocks indefinitely and doesn't respect `context.Context`, the goroutine could leak.
  **Mitigation:** Enforce strict adherence to `context.Context` in all task execution logic. Add timeouts to contexts where appropriate.
- **[Risk] Channel Deadlocks:** Improperly sized or unbuffered channels could cause the main executor loop or workers to deadlock.
  **Mitigation:** Keep the channel architecture simple. The main loop will only read from the `results` channel using `select` with `ctx.Done()`, ensuring it never blocks indefinitely.
