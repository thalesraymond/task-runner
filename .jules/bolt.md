## 2026-02-05 - Promise.race Bottleneck in WorkflowExecutor
**Learning:** `Promise.race(executingPromises)` with large `Set<Promise>` causes O(N²) memory/CPU pressure because `Promise.race` creates a new Promise and attaches listeners to *all* input promises on *every* loop iteration.
**Action:** Use a "signal promise" pattern (manual Promise + resolve function) to wake up the loop only when a task completes, reducing overhead to O(1) per task completion.
