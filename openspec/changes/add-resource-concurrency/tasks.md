## 1. Implementation

- [ ] 1.1 Update `TaskStep` interface in `src/TaskStep.ts` to include `resources?: Record<string, number>`.
- [ ] 1.2 Update `TaskRunnerExecutionConfig` in `src/TaskRunnerExecutionConfig.ts` to include `resourceLimits?: Record<string, number>`.
- [ ] 1.3 Update `WorkflowExecutor` to track active resource usage.
- [ ] 1.4 Update `WorkflowExecutor.processLoop` to validate resource availability before scheduling tasks.
- [ ] 1.5 Update `WorkflowExecutor.executeTaskStep` (or equivalent completion logic) to release resources when a task finishes.
- [ ] 1.6 Add unit tests for resource limiting in `tests/WorkflowExecutor.test.ts`.
- [ ] 1.7 Add integration test for mixed resource usage in `tests/integration/resource-concurrency.test.ts`.
