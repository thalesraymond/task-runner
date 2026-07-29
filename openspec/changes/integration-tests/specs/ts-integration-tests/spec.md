## ADDED Requirements

### Requirement: Retry execution strategy works end-to-end

The system SHALL support retrying failed tasks according to a RetryingExecutionStrategy that wraps StandardExecutionStrategy. Tasks that fail SHALL be retried up to `maxAttempts` times with configurable backoff.

#### Scenario: Failed task is retried and eventually succeeds

- **WHEN** a task fails on the first attempt but succeeds on retry within maxAttempts
- **THEN** the final result SHALL have status "success" and include the retry metadata

#### Scenario: Exhausted retries propagate failure

- **WHEN** a task fails on every attempt up to maxAttempts
- **THEN** the final result SHALL have status "failure" and downstream dependents SHALL be skipped

#### Scenario: Retry with exponential backoff respects delay

- **WHEN** a task is configured with exponential backoff and fails
- **THEN** each retry SHALL wait increasingly longer between attempts

### Requirement: Looping execution strategy works end-to-end

The system SHALL support repeating task execution according to a LoopingExecutionStrategy with configurable loop conditions and max iterations.

#### Scenario: Task loops until condition is met

- **WHEN** a task is configured with a loop condition and the condition is not yet satisfied
- **THEN** the task SHALL re-execute until the condition is met or maxIterations is reached

#### Scenario: Loop respects maxIterations cap

- **WHEN** a task's loop condition never becomes true
- **THEN** the task SHALL stop after maxIterations and return the last result

### Requirement: Conditional execution controls task flow

The system SHALL support conditional task execution where tasks only run when their condition predicate is satisfied. Tasks with unmet conditions SHALL be skipped.

#### Scenario: Conditional task runs when condition passes

- **WHEN** a task has a condition and the context satisfies it
- **THEN** the task SHALL execute and return its result

#### Scenario: Conditional task is skipped when condition fails

- **WHEN** a task has a condition and the context does not satisfy it
- **THEN** the task SHALL be skipped and its dependents SHALL still run (unless they also have unmet conditions)

### Requirement: continueOnError allows downstream execution after failure

The system SHALL support a `continueOnError` flag on tasks. When set, downstream dependents SHALL execute even if the task fails.

#### Scenario: Downstream tasks run after continueOnError failure

- **WHEN** a task fails with continueOnError=true
- **THEN** its dependents SHALL still execute and SHALL NOT be skipped

#### Scenario: continueOnError failure is reflected in result

- **WHEN** a task fails with continueOnError=true
- **THEN** the result map SHALL contain the failure status for that task, and downstream tasks SHALL have their normal results

### Requirement: Plugin lifecycle hooks fire during execution

The system SHALL support plugins with lifecycle hooks (beforeAll, afterAll, beforeTask, afterTask) that fire at the appropriate points during workflow execution.

#### Scenario: Plugin hooks fire in correct order

- **WHEN** a workflow executes with a registered plugin
- **THEN** hooks SHALL fire in order: beforeAll → beforeTask (per task) → afterTask (per task) → afterAll

#### Scenario: Plugin receives task context in hooks

- **WHEN** a plugin's beforeTask/afterTask hooks fire
- **THEN** the plugin SHALL receive the task name and execution context

### Requirement: EventBus emits lifecycle events during execution

The system SHALL emit events (task-started, task-completed, task-failed) on the EventBus during workflow execution.

#### Scenario: Events emitted for each task

- **WHEN** a workflow executes multiple tasks
- **THEN** the EventBus SHALL emit task-started and task-completed/task-failed events for each task

#### Scenario: Events carry correct payload

- **WHEN** an event is emitted
- **THEN** its payload SHALL include the task name, timestamp, and relevant result data

### Requirement: Priority ordering affects execution order

The system SHALL support priority values on tasks. When multiple ready tasks are available, higher-priority tasks SHALL execute before lower-priority ones.

#### Scenario: Higher priority tasks execute first among ready tasks

- **WHEN** multiple independent tasks are ready with different priority values
- **THEN** the higher-priority task SHALL complete before the lower-priority task

### Requirement: Combined-feature scenarios work correctly

The system SHALL correctly handle workflows that combine multiple features: retries + cancellation, looping + conditional, plugins + events, continueOnError + retries.

#### Scenario: Retry strategy respects cancellation signal

- **WHEN** a task is being retried and the execution is cancelled via AbortSignal
- **THEN** the retry SHALL stop and the task SHALL be marked as cancelled

#### Scenario: Looping with conditional executes correctly

- **WHEN** a task has both a loop and a condition
- **THEN** the condition SHALL be evaluated each iteration and the loop SHALL terminate when the condition is met
