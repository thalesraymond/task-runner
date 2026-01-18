# Feature: Per-Task Timeout

## 🎯 User Story
"As a developer, I want to define a maximum execution time for specific tasks so that a single hung task (e.g., a stalled network request) fails fast without blocking the rest of the independent tasks or waiting for the global workflow timeout."

## ❓ Why
Currently, the `TaskRunner` allows a **global** timeout for the entire `execute()` call. However, this is insufficient for granular control:
1.  **Varying Latency**: Some tasks are expected to be fast (local validation), others slow (data fetching). A global timeout of 30s is too loose for the fast ones.
2.  **Boilerplate**: Developers currently have to manually implement `setTimeout`, `Promise.race`, and `AbortController` logic inside every `run()` method to handle timeouts properly.
3.  **Resilience**: A single "zombie" task can hold up the entire pipeline until the global timeout kills everything. Per-task timeouts allow failing that specific task (and skipping its dependents) while letting other independent tasks continue.

## 🛠️ What Changes
1.  **Interface Update**: Update `TaskStep<T>` to accept an optional `timeout` property (in milliseconds).
2.  **Execution Strategy**: Update `StandardExecutionStrategy` to:
    -   Create a local timeout timer for the task.
    -   Create a combined `AbortSignal` (merging the workflow's signal and the local timeout).
    -   Race the task execution against the timer.
    -   Return a specific failure result if the timeout wins.

## ✅ Acceptance Criteria
- [ ] A task with `timeout: 100` must fail if the `run` method takes > 100ms.
- [ ] The error message for a timed-out task should clearly state "Task timed out after 100ms".
- [ ] The `AbortSignal` passed to the task's `run` method must be triggered when the timeout occurs.
- [ ] If the Global Workflow is cancelled *before* the task times out, the task should receive the cancellation signal immediately.
- [ ] A task completing *before* the timeout should clear the timer to prevent open handles.
