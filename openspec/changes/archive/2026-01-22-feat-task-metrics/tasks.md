## 1. Implementation

- [x] 1.1 Update `TaskResult` interface in `src/TaskResult.ts` to include `metrics`.
- [x] 1.2 Update `WorkflowExecutor.ts` to capture start/end times using `performance.now()` and calculate duration.
- [x] 1.3 Update `WorkflowExecutor.ts` to inject metrics into the `TaskResult`.
- [x] 1.4 Add unit tests in `tests/TaskMetrics.test.ts` to verify metrics are present and correct.
