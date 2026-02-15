# Change: feat-task-loop

## Why

Users often need to orchestrate tasks that involve waiting for a condition to be met, such as polling an API for a deployment status or waiting for a database to be healthy. Currently, this logic must be implemented imperatively within the `run` method of a task, which obscures the intent and mixes orchestration concerns with business logic.

## What Changes

- Add a `loop` configuration to the `TaskStep` interface.
- Introduce a `LoopingExecutionStrategy` that wraps other strategies to handle conditional re-execution.
- The `loop` configuration will support:
    - `interval`: Time in milliseconds to wait between iterations.
    - `maxIterations`: Maximum number of times to run the task.
    - `until`: A predicate function `(context, result) => boolean` that determines when the loop should stop.

## Impact

- **Affected Specs**: `task-runner`
- **Affected Code**:
    - `src/TaskStep.ts`: Update interface.
    - `src/strategies/LoopingExecutionStrategy.ts`: New file.
    - `src/TaskRunnerBuilder.ts`: Integrate the new strategy.
