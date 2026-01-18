## ADDED Requirements

### Requirement: Task Retry Configuration

The `TaskStep` interface SHALL support an optional `retry` property of type `TaskRetryConfig`.

#### Scenario: Retry Config Structure

- **GIVEN** a `TaskRetryConfig` object
- **THEN** it SHALL support:
  - `attempts`: Number of retry attempts (default: 0).
  - `delay`: Base delay in milliseconds (default: 0).
  - `backoff`: Backoff strategy ('fixed' | 'exponential') (default: 'fixed').

### Requirement: Retrying Execution Strategy

The system SHALL provide a `RetryingExecutionStrategy` that implements `IExecutionStrategy` and wraps another `IExecutionStrategy`.

#### Scenario: Successful execution

- **WHEN** the inner strategy returns a successful `TaskResult`
- **THEN** `RetryingExecutionStrategy` SHALL return that result immediately.

#### Scenario: Retry on failure

- **WHEN** the inner strategy throws or returns a failed `TaskResult`
- **AND** the task has `retry.attempts > 0`
- **THEN** it SHALL wait for the configured `delay`.
- **AND** it SHALL re-execute the task using the inner strategy.
- **AND** it SHALL decrement the remaining attempts.

#### Scenario: Max attempts reached

- **WHEN** the task fails and no attempts remain
- **THEN** it SHALL return the failed result (or throw).

#### Scenario: Exponential Backoff

- **WHEN** `retry.backoff` is 'exponential'
- **THEN** the delay SHALL increase for each attempt (e.g., `delay * 2^attempt`).
