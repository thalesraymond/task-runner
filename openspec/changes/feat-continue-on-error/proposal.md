# Change: Continue On Error

## Why

Currently, if a task fails, all tasks that depend on it are automatically skipped. This is a safe default, but it prevents users from defining "non-critical" tasks (e.g., "Cleanup Temp Files", "Send Optional Notification") that should not block the workflow if they fail. Users often want downstream tasks to continue executing even if a specific non-essential dependency fails.

## What Changes

- Update `TaskStep` interface to include an optional `continueOnError: boolean` property (defaulting to `false`).
- Update `TaskStateManager` to be aware of task definitions.
- Update `TaskStateManager.processDependencies` logic:
  - If a dependency failed but has `continueOnError: true`, treat it as "satisfied" for the purpose of unblocking dependents.
  - The dependent task will execute as if the dependency succeeded.
- The failed task's result remains `status: "failure"`, preserving visibility of the error.

## Impact

- Affected specs: `001-generic-task-runner`
- Affected code: `src/TaskStep.ts`, `src/TaskStateManager.ts`
- **Non-breaking change**: The default behavior remains (stop on error). Users must opt-in by setting the flag.
