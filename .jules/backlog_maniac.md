# Backlog Maniac Journal

## 2026-05-24: Initial Scan

### Code Smells
* **EventBus Type Assertions**: The `EventBus.ts` uses `as unknown as ListenerMap<TContext>[K]` which is a bit rough. It's safe but ugly.
* **WorkflowExecutor.ts**: The `processQueue` method is a bit monolithic. It calls `handleSkippedTasks` and `getReadySteps` and `runStep`.
* **TaskStep.ts**: The `run` method doesn't support an `AbortSignal`, which is crucial for modern cancellation.

### Potential Improvements
1.  **Add `AbortSignal` to `TaskStep.run`**: This would allow tasks to be cancelled cooperatively.
2.  **Add `isCancelled` check in `WorkflowExecutor`**: If the runner is cancelled, we should stop executing new tasks.
3.  **Refactor `EventBus` types**: Make the types cleaner without double casting.
4.  **Add `concurrency` control**: Currently, it runs all ready tasks. A limit would be nice.

### Decision
I will focus on **Adding `AbortSignal` support**.
It's a "Quality of Life" improvement that makes the library more robust for real-world usage (e.g., in a UI or a server where requests can be cancelled).
It fits the "Modern & Maintainable" criteria.
