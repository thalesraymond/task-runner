# Change: Add Concurrency Control

## Why
The current implementation executes *all* independent tasks in parallel. In large graphs with many independent nodes, this could overwhelm system resources (CPU, memory) or trigger external API rate limits.

## What Changes
- Add a concurrency control mechanism to the `TaskRunner`.
- Add `concurrency: number` to the `TaskRunnerExecutionConfig`.
- Implement a task queue to hold tasks that are ready but waiting for a free slot.
- Update `WorkflowExecutor` to respect the concurrency limit.

## Impact
- Affected specs: `task-runner`
- Affected code: `src/TaskRunner.ts`, `src/WorkflowExecutor.ts`, `src/TaskRunnerExecutionConfig.ts`
