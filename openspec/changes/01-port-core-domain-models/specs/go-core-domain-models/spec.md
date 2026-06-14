## ADDED Requirements

### Requirement: Task Execution Interface
The system SHALL define a generic `Task[T any]` interface that dictates how individual tasks are executed.

#### Scenario: Running a task
- **WHEN** a task is implemented using the `Task[T any]` interface
- **THEN** it MUST provide a `Run(ctx context.Context, sharedState T) TaskResult` method.

### Requirement: Task Status Tracking
The system SHALL define discrete states for task execution outcomes.

#### Scenario: Assessing task outcomes
- **WHEN** a task finishes execution
- **THEN** the returned `TaskResult` MUST include one of the predefined `TaskStatus` values (e.g., Success, Failure, Skipped, Cancelled).

### Requirement: Context Propagation
The system SHALL enforce the use of `context.Context` within the `Task` interface for lifecycle management.

#### Scenario: Task cancellation
- **WHEN** a task is running and the parent execution is aborted
- **THEN** the task MUST receive a cancelled `context.Context`, allowing it to clean up and return early with a `StatusCancelled` result.
