## ADDED Requirements

### Requirement: Concurrency Limit

The `WorkflowExecutor` SHALL limit the number of concurrently executing tasks if a `concurrency` limit is provided.

#### Scenario: Concurrency limit applied

- **GIVEN** a `WorkflowExecutor` configured with `concurrency: N`
- **WHEN** multiple independent tasks become ready
- **THEN** no more than N tasks SHALL be in the 'running' state simultaneously.

#### Scenario: Queueing ready tasks

- **WHEN** the number of running tasks equals the `concurrency` limit
- **THEN** any additional tasks that become ready SHALL remain in the 'ready' state until a slot becomes available.

#### Scenario: Slot release

- **WHEN** a running task completes or fails
- **THEN** the loop SHALL immediately check for ready tasks and start them up to the limit.

#### Scenario: Default unlimited concurrency

- **WHEN** `WorkflowExecutor` is initialized without a `concurrency` option (or 0/undefined)
- **THEN** it SHALL execute all ready tasks immediately (unlimited concurrency).
