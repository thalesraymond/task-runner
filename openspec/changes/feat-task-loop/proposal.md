# Change: Add Task Loop (Declarative Polling)

## Why

Users currently have to implement polling logic (e.g., "wait for deployment to finish") manually inside the `run` function using `while` loops. This hides the progress from the runner, treating a potentially long-running polling operation as a single "hanging" task. It also forces users to abuse the `retry` mechanism (throwing errors on "not ready" states) which conflates transient failures with expected waiting periods.

## What Changes

- Introduce a `loop` configuration to `TaskStep`.
- Add a `LoopingExecutionStrategy` that wraps the `RetryingExecutionStrategy`.
- Support declarative conditions for "success" separate from "task completion".

## Impact

- **Affected Specs**: `task-runner`
- **Affected Code**: `TaskStep` interface, `TaskRunnerBuilder`, Execution Strategies.
