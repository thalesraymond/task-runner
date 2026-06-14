## ADDED Requirements

### Requirement: Enforce concurrency limits
The Go workflow executor MUST respect the configured maximum concurrency limits.

#### Scenario: Maximum concurrent tasks reached
- **WHEN** more tasks become ready than the allowed concurrency limit
- **THEN** only a number of tasks equal to the limit are dispatched simultaneously
- **AND** further tasks wait until a currently running task completes

### Requirement: Handle workflow cancellation
The executor MUST listen for context cancellation and terminate pending and running work.

#### Scenario: Context is cancelled during execution
- **WHEN** the parent `context.Context` is cancelled
- **THEN** the main execution loop exits immediately
- **AND** running tasks receive the cancellation signal and gracefully exit

### Requirement: Report task completion
The executor MUST notify the task manager upon a task's success or failure.

#### Scenario: Task completes successfully
- **WHEN** a task goroutine finishes execution without error
- **THEN** it sends a success result to the executor's results channel
- **AND** the executor updates the `TaskStateManager`

#### Scenario: Task fails
- **WHEN** a task goroutine returns an error
- **THEN** it sends a failure result to the executor's results channel
- **AND** the executor updates the `TaskStateManager` and potentially halts the workflow based on configuration
