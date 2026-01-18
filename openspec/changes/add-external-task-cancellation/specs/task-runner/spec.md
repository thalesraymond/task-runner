## MODIFIED Requirements
### Requirement: TaskRunner Execution
The `TaskRunner` SHALL execute a sequence of `TaskStep`s based on their dependencies, processing inputs and producing outputs.

#### Scenario: Successful execution
- **WHEN** all `TaskStep`s complete successfully
- **THEN** the `TaskRunner` returns a successful workflow result.

#### Scenario: Execution with AbortSignal
- **WHEN** `TaskRunner.execute` is called with an `AbortSignal`
- **THEN** the `TaskRunner` monitors the `AbortSignal` for cancellation requests.

#### Scenario: Execution with Global Timeout
- **WHEN** `TaskRunner.execute` is called with a `timeout` option
- **THEN** the `TaskRunner` monitors the elapsed time for the workflow.

## ADDED Requirements
### Requirement: External Workflow Cancellation
The `TaskRunner` SHALL allow external cancellation of an ongoing workflow.

#### Scenario: Workflow cancelled by AbortSignal
- **WHEN** an `AbortSignal` provided to `TaskRunner.execute` is triggered
- **THEN** the `TaskRunner` immediately attempts to stop execution of current and pending tasks.

#### Scenario: Workflow cancelled by Global Timeout
- **WHEN** the specified global `timeout` for `TaskRunner.execute` is reached
- **THEN** the `TaskRunner` immediately attempts to stop execution of current and pending tasks.

#### Scenario: Tasks marked as cancelled
- **WHEN** a workflow is cancelled (by `AbortSignal` or `timeout`)
- **THEN** all unexecuted `TaskStep`s SHALL be marked with a 'cancelled' status in the final result.

#### Scenario: Pre-aborted workflow
- **WHEN** `TaskRunner.execute` is called with an `AbortSignal` that is already aborted
- **THEN** the `TaskRunner` SHALL return immediately with all tasks marked as cancelled, without executing any steps.

#### Scenario: Graceful interruption of current task
- **WHEN** a workflow is cancelled and a `TaskStep` is currently executing
- **THEN** the `TaskStep` SHALL receive the cancellation signal (e.g., via `AbortSignal` context) to allow for graceful interruption.

### Requirement: Cancellation Conflict Resolution
The `TaskRunner` SHALL handle scenarios where both `AbortSignal` and global `timeout` are provided.

#### Scenario: AbortSignal precedes Timeout
- **WHEN** both `AbortSignal` and `timeout` are provided, and `AbortSignal` is triggered first
- **THEN** the `TaskRunner` SHALL cancel the workflow based on the `AbortSignal`, ignoring the `timeout`.

#### Scenario: Timeout precedes AbortSignal
- **WHEN** both `AbortSignal` and `timeout` are provided, and `timeout` is reached first
- **THEN** the `TaskRunner` SHALL cancel the workflow based on the `timeout`, ignoring the `AbortSignal`.