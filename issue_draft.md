## 📝 Issue: 🐛 [Bug]: Pending tasks do not emit events when workflow is cancelled
**Type:** Bug
**Complexity:** Low
**Labels:** `[bug]`, `[good-first-issue]`
### 💥 Description
When a workflow is cancelled (via signal or timeout), tasks that are currently running emit `taskEnd` (with status "cancelled"), but tasks that were still pending (waiting for dependencies) are silently marked as "cancelled" in the final results without emitting any event.
Consumers relying on `taskSkipped` or `taskEnd` to track progress will miss these tasks entirely, leading to incomplete logs or "hanging" UI states.

### 👣 Reproduction Steps (For Bugs)
1. Create a `TaskRunner` with two tasks: Task A (long running) and Task B (depends on A).
2. Start the execution with an `AbortController`.
3. Abort the execution while Task A is running.
4. Subscribe to `taskEnd` and `taskSkipped` events.
5. Observe that Task A emits `taskEnd` (status: cancelled), but Task B emits nothing, even though it appears in the final results as "cancelled".

### 🟢 Expected Behavior
Pending tasks that are cancelled should emit a `taskSkipped` event (with status: "cancelled"), consistent with how tasks skipped due to dependency failure behave. This allows consumers to have a complete picture of the workflow execution.

### 🧩 Contributor Guide (If Good First Issue)
*   **Where to start:** Look at `src/TaskStateManager.ts`.
*   **Goal:** In the `cancelAllPending` method, instead of directly setting the result in the map, use the `markSkipped` method (or similar logic) to ensure the event is emitted.
*   **Hint:** Check how `processDependencies` uses `markSkipped` when a dependency fails.
