## ADDED Requirements
### Requirement: Task Retry Policy
The `TaskRunner` SHALL support retrying tasks that return a failure status or throw an error, based on a configuration policy.

#### Scenario: Retry on failure
- **WHEN** a `TaskStep` fails and has a `retry` configuration with `attempts > 0`
- **THEN** the `TaskRunner` SHALL attempt to execute the task again.

#### Scenario: Retry count limit
- **WHEN** a task fails consecutively more times than the configured `attempts`
- **THEN** the task SHALL be marked as failed and no further queries SHALL be made.

#### Scenario: Retry delay
- **WHEN** a task is scheduled for retry and `delay` is configured
- **THEN** the `TaskRunner` SHALL wait for at least `delay` milliseconds before the next attempt.

#### Scenario: Exponential backoff
- **WHEN** `backoff` is set to 'exponential'
- **THEN** the wait time between attempts SHALL increase exponentially (e.g., `delay * 2^attempt`).

#### Scenario: Success after retry
- **WHEN** a task fails one or more times but succeeds on a subsequent retry attempt
- **THEN** the task status SHALL be recorded as 'success' and dependent tasks SHALL proceed.
