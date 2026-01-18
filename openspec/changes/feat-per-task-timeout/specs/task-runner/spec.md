## ADDED Requirements

### Requirement: Per-Task Timeout
The `TaskStep` interface SHALL support an optional `timeout` property, and the `StandardExecutionStrategy` SHALL enforce this timeout.

#### Scenario: Task completes within timeout
- **GIVEN** a task with `timeout: 100` (ms)
- **WHEN** the task execution takes 50ms
- **THEN** the task SHALL complete successfully.
- **AND** the timeout timer SHALL be cleared immediately.

#### Scenario: Task exceeds timeout
- **GIVEN** a task with `timeout: 100` (ms)
- **WHEN** the task execution attempts to run longer than 100ms
- **THEN** the task execution SHALL be aborted with an error indicating a timeout.
- **AND** the `TaskResult` status SHALL be 'failure' (or 'cancelled' if appropriate, but typically 'failure' due to timeout error).
- **AND** the `AbortSignal` passed to the task's `run` method SHALL be triggered.

#### Scenario: Global cancellation overrides task timeout
- **GIVEN** a task with `timeout: 5000` (ms)
- **WHEN** the workflow's global `AbortSignal` is triggered at 100ms
- **THEN** the task SHALL receive the abort signal immediately (at 100ms).
- **AND** the task SHALL NOT wait for the 5000ms timeout.
- **AND** the `TaskResult` status SHALL be 'cancelled'.

#### Scenario: Task without timeout
- **GIVEN** a task without a `timeout` property
- **WHEN** it executes
- **THEN** it SHALL NOT be subject to any local timeout constraints (only global workflow timeout).
