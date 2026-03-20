## ADDED Requirements

### Requirement: Task Looping

The `TaskStep` interface SHALL support an optional `loop` property of type `TaskLoopConfig` to enable conditional re-execution of a task (polling).

#### Scenario: Loop until condition met

- **GIVEN** a task with a `loop` configuration
- **AND** the `loop.until` predicate returns `false`
- **THEN** the task SHALL re-execute after the specified `interval`.
- **WHEN** the `loop.until` predicate returns `true`
- **THEN** the task SHALL complete successfully with the last result.

#### Scenario: Max iterations reached

- **GIVEN** a task with a `loop` configuration
- **AND** the task has re-executed `maxIterations` times without the predicate returning `true`
- **THEN** the task SHALL fail with an error indicating the loop limit was reached.

#### Scenario: Integration with Retries

- **GIVEN** a task with both `retry` and `loop` configurations
- **WHEN** the task fails (throws an error)
- **THEN** the `RetryingExecutionStrategy` SHALL handle the retry logic first.
- **AND** the loop iteration SHALL only count once the task executes successfully (or fails after retries).

#### Scenario: Loop Config Structure

- **GIVEN** a `TaskLoopConfig` object
- **THEN** it SHALL support:
  - `interval`: Time in milliseconds to wait between iterations (default: 0).
  - `maxIterations`: Maximum number of iterations (default: 1).
  - `until`: A predicate function `(context: TContext, result: TaskResult) => boolean`.
