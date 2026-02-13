# Workflow State Persistence Specification

## Purpose

Enables the `TaskRunner` to save its execution state and resume from that state later, allowing for recovery from failures or pausing long-running workflows without re-executing completed tasks.

## Requirements

### Requirement: State Snapshot Exposure

The system SHALL provide a mechanism to retrieve the current execution state of a workflow.

#### Scenario: Retrieving state from TaskRunner

- **WHEN** a workflow is running or completed
- **THEN** the `TaskRunner` (or its underlying `TaskStateManager`) SHALL expose a method to retrieve a snapshot of the current state.
- **AND** the snapshot SHALL contain the `results` of all executed tasks.
- **AND** the snapshot SHALL be serializable (e.g., to JSON).

### Requirement: Hydrated Initialization

The system SHALL allow initializing a `TaskRunner` with a pre-existing state snapshot.

#### Scenario: Initializing with a snapshot

- **GIVEN** a valid state snapshot from a previous execution
- **WHEN** the `TaskRunner` is built using `TaskRunnerBuilder`
- **THEN** the builder SHALL accept the snapshot as an initial state.
- **AND** the `TaskRunner` SHALL start with the internal state reflecting the snapshot (i.e., known task results).

### Requirement: Resumable Execution Logic

The `WorkflowExecutor` SHALL respect the initial hydrated state during execution, skipping already completed tasks.

#### Scenario: Skipping successful tasks

- **GIVEN** a `TaskRunner` initialized with a snapshot where Task A is marked as `success`
- **WHEN** `execute()` is called
- **THEN** Task A SHALL NOT be executed again.
- **AND** Task A SHALL be considered completed for the purpose of checking dependencies of downstream tasks.

#### Scenario: Re-running non-successful tasks

- **GIVEN** a `TaskRunner` initialized with a snapshot where Task B is marked as `failure`, `cancelled`, or `skipped`
- **WHEN** `execute()` is called
- **THEN** Task B SHOULD be evaluated for execution (subject to dependency checks).

#### Scenario: Handling Context

- **GIVEN** a resumed workflow
- **THEN** it is the caller's responsibility to provide the necessary `Context` for task execution.
- **AND** the `TaskRunner` SHALL NOT attempt to automatically restore the context object from the state snapshot (as it may contain non-serializable data).
