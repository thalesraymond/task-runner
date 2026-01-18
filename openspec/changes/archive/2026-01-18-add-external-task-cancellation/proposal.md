# Change: Add External Task Cancellation

## Why

Once `TaskRunner.execute()` is called, there is no way to cancel the operation externally. If a task hangs or if the user wants to abort the workflow (e.g., in a CLI or UI context), the runner continues until completion or failure. This limits the responsiveness and control users have over long-running operations.

## What Changes

- The `TaskRunner.execute()` method will be updated to accept an optional configuration object.
- This configuration object will support an `AbortSignal` for external cancellation.
- The configuration object will also support a global timeout for the entire workflow.
- Tasks will be able to respond to cancellation signals and report their status accordingly.

## Impact

- Affected specs: `001-generic-task-runner` (specifically the `TaskRunner`'s `execute` method behavior)
- Affected code: `src/TaskRunner.ts`, `src/contracts/RunnerEvents.ts` (for cancellation events), potentially `src/TaskStep.ts` (to propagate `AbortSignal` to individual steps).
