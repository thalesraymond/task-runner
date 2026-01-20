# Change: Task Execution Metrics

## Why

Users currently lack visibility into the performance of individual tasks within a workflow. When a workflow is slow, it is difficult to identify which task is the bottleneck without adding manual logging code to every task. Providing built-in execution metrics (start time, end time, duration) will allow users to optimize their workflows and debug performance issues more effectively.

## What Changes

- Update `TaskResult` interface to include an optional `metrics` property containing `startTime`, `endTime`, and `duration`.
- Update `WorkflowExecutor` to capture these timestamps during task execution and populate the `metrics` property.
- Ensure these metrics are available in the final `TaskResult` map returned by `TaskRunner.execute`.

## Impact

- Affected specs: `001-generic-task-runner`
- Affected code: `src/TaskResult.ts`, `src/WorkflowExecutor.ts`
- **Non-breaking change**: The new property is optional, so existing code consuming `TaskResult` will continue to work.
