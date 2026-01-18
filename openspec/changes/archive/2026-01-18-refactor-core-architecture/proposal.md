# Change: Refactor Core Architecture

## Why

When multiple developers work on the project, conflicts arise due to tight coupling and poor separation of concerns. Large classes like `WorkflowExecutor` are taking on too many responsibilities, and there is duplicated logic around graph traversal and state management.

## What Changes

- Decouple `WorkflowExecutor` from `EventBus` (pass a listener interface or use a mediating controller).
- Extract `TaskExecutionStrategy` to allow pluggable execution modes (e.g., standard, dry-run, debug).
- Centralize state management for task results and context, moving it out of the executor loop.
- Standardize error handling and logging (QoL improvements).

## Impact

- Affected specs: `task-runner` (no behavior change, but structural refactor)
- Affected code: `src/WorkflowExecutor.ts`, `src/TaskRunner.ts`, new files for extracted logic.
