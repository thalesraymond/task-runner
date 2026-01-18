# Change: Add Task Retry Policy

## Why
Tasks currently run once and fail immediately if they throw an error or return a failure status. Network glitches or transient issues can therefore cause an entire workflow to fail unnecessarily.

## What Changes
- Allow tasks to define a retry policy.
- Update `TaskStep` interface to include optional `retry` configuration.
- Implement logic in `TaskRunner` (or `WorkflowExecutor`) to catch failures, check the retry policy, and re-execute the task after the specified delay.

## Impact
- Affected specs: `task-runner`
- Affected code: `src/TaskStep.ts`, `src/WorkflowExecutor.ts` (or `TaskRunner.ts`), `src/contracts/TaskRetryConfig.ts`
