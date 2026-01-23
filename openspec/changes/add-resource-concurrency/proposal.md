# Change: Add Resource-Based Concurrency Control

## Why

Global concurrency limits (`concurrency: 5`) are too blunt for workflows accessing heterogeneous resources. A workflow might bottleneck on a slow API (e.g., Jira) while underutilizing a fast one (e.g., Redis). Users need to define concurrency limits *per resource type* (e.g., "max 2 Jira requests", "max 50 DB writes") to optimize throughput without overloading specific downstream services.

## What Changes

- **TaskStep Interface**: Add `resources` property (e.g., `{ cpu: 1, github_api: 1 }`).
- **TaskRunnerExecutionConfig**: Add `resourceLimits` property (e.g., `{ github_api: 5 }`).
- **WorkflowExecutor**: Update the `processLoop` to check if *both* global concurrency AND specific resource limits are satisfied before starting a task.
- **State Management**: Track currently consumed resources in `WorkflowExecutor`.

## Impact

- **Affected Specs**: `task-runner`
- **Affected Code**: `src/TaskStep.ts`, `src/TaskRunnerExecutionConfig.ts`, `src/WorkflowExecutor.ts`.
- **Breaking Changes**: None. Optional properties added.
