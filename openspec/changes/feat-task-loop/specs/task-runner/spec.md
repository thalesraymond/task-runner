## ADDED Requirements

### Requirement: Task Loop Configuration

The `TaskStep` interface SHALL support an optional `loop` property of type `TaskLoopConfig`.

#### Scenario: Loop Config Structure

- **GIVEN** a `TaskLoopConfig` object
- **THEN** it SHALL support:
  - `interval`: Delay in milliseconds between iterations.
  - `maxIterations`: Maximum number of iterations (default: 10).
  - `until`: A predicate function `(context, result) => boolean` that determines if the loop should stop (return true) or continue (return false).

### Requirement: Looping Execution Strategy

The system SHALL provide a `LoopingExecutionStrategy` that implements `IExecutionStrategy` and wraps another `IExecutionStrategy`.

#### Scenario: Condition met immediately

- **WHEN** the inner strategy executes successfully
- **AND** the `until` predicate returns `true`
- **THEN** the task SHALL complete successfully immediately.

#### Scenario: Condition met after polling

- **WHEN** the inner strategy executes successfully
- **AND** the `until` predicate returns `false`
- **THEN** the strategy SHALL wait for `interval` milliseconds.
- **AND** it SHALL re-execute the inner strategy.
- **AND** it SHALL repeat this until `until` returns `true`.

#### Scenario: Max iterations reached

- **WHEN** the `until` predicate returns `false`
- **AND** the number of iterations reaches `maxIterations`
- **THEN** the task SHALL fail with a "Loop limit exceeded" error.

#### Scenario: Inner strategy failure

- **WHEN** the inner strategy fails (throws or returns failure)
- **THEN** the loop SHALL abort immediately and return the failure (bubbling up the error).
