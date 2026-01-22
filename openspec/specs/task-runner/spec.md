# task-runner Specification

## Purpose

TBD - created by archiving change add-external-task-cancellation. Update Purpose after archive.

## Requirements

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

### Requirement: Integration Verification

The system's integrity SHALL be verified through comprehensive integration scenarios executed against the real runtime environment without mocks.

#### Scenario: Complex Graph Execution

- **WHEN** a complex task graph (diamonds, sequences, parallel branches) is executed
- **THEN** the system SHALL respect all dependency constraints and execution orders.
- **AND** the final state MUST reflect the cumulative side effects of all successful tasks.

#### Scenario: Failure Propagation

- **WHEN** a task fails in a complex graph
- **THEN** ONLY dependent tasks SHALL be skipped
- **AND** independent branches SHALL continue to execute to completion.

#### Scenario: Context Integrity

- **WHEN** multiple tasks mutate the shared context
- **THEN** state changes MUST be propagated correctly to downstream tasks.

### Requirement: Modular Execution Architecture

The system SHALL support pluggable execution strategies and decoupled state management.

#### Scenario: Pluggable Strategy

- **WHEN** configured with a custom execution strategy
- **THEN** the `TaskRunner` SHALL delegate the execution logic to that strategy.

### Requirement: Dry Run Execution Strategy

The system SHALL provide a `DryRunExecutionStrategy` that implements `IExecutionStrategy`.

#### Scenario: Simulating execution

- **WHEN** `WorkflowExecutor` is configured with `DryRunExecutionStrategy`
- **AND** `execute` is called
- **THEN** it SHALL traverse the dependency graph respecting order
- **AND** it SHALL NOT execute the actual work of the `TaskStep`.
- **AND** it SHALL return `TaskResult`s with a status indicating successful simulation (e.g., `simulated` or `success`).

### Requirement: Mermaid Visualization

The system SHALL provide a utility to generate a Mermaid.js graph from task steps.

#### Scenario: Generate Mermaid Graph

- **GIVEN** a list of `TaskStep`s with dependencies
- **WHEN** `generateMermaidGraph` is called
- **THEN** it SHALL return a valid Mermaid flowchart syntax string.
- **AND** dependencies SHALL be represented as arrows (`-->`).
- **AND** independent tasks SHALL appear as nodes.

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

### Requirement: Task Execution Metrics

The system SHALL record timing metrics for each executed task, including start time, end time, and duration.

#### Scenario: Successful execution
- **WHEN** a task completes successfully
- **THEN** the task result contains the start timestamp, end timestamp, and duration in milliseconds

#### Scenario: Failed execution
- **WHEN** a task fails
- **THEN** the task result contains the start timestamp, end timestamp, and duration in milliseconds
