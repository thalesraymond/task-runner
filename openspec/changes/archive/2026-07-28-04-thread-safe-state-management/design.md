## Context

The `TaskStateManager` is responsible for tracking task progress, maintaining the dependency graph, and updating task execution states. The Node.js implementation relies on the single-threaded event loop, which inherently prevents concurrent mutation issues. The new Go implementation will execute tasks highly concurrently. Without thread safety, race conditions will occur when multiple tasks finish simultaneously and attempt to update the state manager.

## Goals / Non-Goals

**Goals:**
- Provide a thread-safe `TaskStateManager` in Go.
- Ensure state transitions (e.g., pending -> running -> completed) are atomic.
- Safely resolve and propagate skipped states to dependent tasks.
- Avoid deadlocks through careful lock design.

**Non-Goals:**
- Changing the overall architecture of how task resolution works.
- Making the Node.js implementation concurrent (it remains single-threaded).

## Decisions

- **Use `sync.RWMutex` to protect internal state maps and queues.**
  - *Rationale*: There will be many concurrent readers (checking dependencies, reading task results) but writes only happen when tasks finish or start. `sync.RWMutex` minimizes contention compared to a plain `sync.Mutex`.
- **Encapsulate synchronization inside `TaskStateManager`.**
  - *Rationale*: Enforces separation of concerns. The executor logic becomes simpler and less prone to lock misuse or data races if the state manager is responsible for its own thread safety.

## Risks / Trade-offs

- [Risk: Deadlocks] → *Mitigation*: Ensure locks are held strictly for the duration of map/queue access, and never while executing external calls or blocking operations.
- [Risk: Lock contention slowing execution] → *Mitigation*: Use `sync.RWMutex` to allow concurrent reads and avoid bottlenecks.
