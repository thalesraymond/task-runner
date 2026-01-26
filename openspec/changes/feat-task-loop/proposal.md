# Change: Task Loop (Conditional Execution)

## Why

Currently, users who need to perform polling (e.g., waiting for an API resource, checking database status) or repetitive tasks often misuse the `retry` mechanism or write manual loops outside the task runner. This conflates "reliability" (retries) with "business logic" (looping until a condition is met). It also makes the workflow graph inaccurate, as a single "task" in the graph might actually represent 50 polling attempts.

## What Changes

- Introduce a `loop` configuration to the `TaskStep` interface.
- Implement a `LoopingExecutionStrategy` that wraps the `RetryingExecutionStrategy`.
- The loop continues executing the task *only if* the previous execution was successful, until a `done` condition is met.
- If the task fails (after retries are exhausted), the loop aborts and the task fails.

## User Story

"As a developer building asynchronous workflows, I want to define tasks that repeat until a specific condition is met (like polling an API or waiting for a database record), so that I can handle long-running external processes cleanly without writing custom loop logic."

## Acceptance Criteria

- **Interface**: `TaskStep` has an optional `loop` property of type `TaskLoopConfig`.
- **Config**: `TaskLoopConfig` includes:
  - `done`: `(context: TContext, lastResult: TaskResult) => boolean | Promise<boolean>` (Return true to stop).
  - `delay`: number (ms to wait between iterations).
  - `maxIterations`: number (safety limit).
- **Behavior**:
  - The task executes at least once.
  - If `done` returns `false`, it waits `delay` ms and runs again.
  - If `done` returns `true`, it returns the last result.
  - If `maxIterations` is reached, the task fails with `LoopTimeoutError`.
  - If the task throws/fails (and retries don't save it), the loop stops immediately and returns the failure.
- **Cancellation**: AbortSignal propagates to the delay and the task execution, stopping the loop immediately.

## Impact

- **Affected specs**: `task-runner`
- **Affected code**: `src/TaskStep.ts`, `src/TaskRunner.ts`, new strategy in `src/strategies/LoopingExecutionStrategy.ts`.
- **Non-breaking change**: Completely opt-in.
