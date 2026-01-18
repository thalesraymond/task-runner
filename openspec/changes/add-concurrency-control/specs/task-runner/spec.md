## ADDED Requirements
### Requirement: Concurrency Control
The `TaskRunner` SHALL limit the number of concurrently executing tasks if configured.

#### Scenario: Concurrency limit applied
- **WHEN** `TaskRunner.execute` is called with a `concurrency` limit of N
- **THEN** no more than N tasks SHALL be in the 'running' state simultaneously.

#### Scenario: Queueing ready tasks
- **WHEN** the number of running tasks equals the `concurrency` limit
- **THEN** any additional tasks that become ready (dependencies resolved) SHALL be queued until a slot becomes available.

#### Scenario: Slot release
- **WHEN** a running task completes or fails
- **THEN** the next queued task (if any) SHALL be started, maintaining the concurrency limit.

#### Scenario: Default unlimited concurrency
- **WHEN** `TaskRunner.execute` is called without a `concurrency` option
- **THEN** the `TaskRunner` SHALL execute all ready tasks immediately (unlimited concurrency).
