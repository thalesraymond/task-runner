## ADDED Requirements

### Requirement: Task Execution Metrics

The system SHALL record timing metrics for each executed task, including start time, end time, and duration.

#### Scenario: Successful execution

- **WHEN** a task completes successfully
- **THEN** the task result contains the start timestamp, end timestamp, and duration in milliseconds

#### Scenario: Failed execution

- **WHEN** a task fails
- **THEN** the task result contains the start timestamp, end timestamp, and duration in milliseconds
