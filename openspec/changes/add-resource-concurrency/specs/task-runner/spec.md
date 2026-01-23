## ADDED Requirements

### Requirement: Resource-Based Concurrency Control

The system SHALL support limiting concurrency based on abstract resources defined by tasks.

#### Scenario: Task defines resource usage
- **GIVEN** a `TaskStep` with `resources: { "api_call": 1 }`
- **WHEN** the task is executed
- **THEN** the system SHALL account for 1 unit of "api_call" consumption.

#### Scenario: Execution limited by resource availability
- **GIVEN** `resourceLimits` is configured with `{ "db_connection": 2 }`
- **AND** 3 tasks are ready, each requiring 1 "db_connection"
- **WHEN** execution proceeds
- **THEN** only 2 tasks SHALL execute concurrently.
- **AND** the 3rd task SHALL wait until resources are released.

#### Scenario: Global and Resource limits combined
- **GIVEN** `concurrency` is set to 5
- **AND** `resourceLimits` is `{ "heavy_job": 2 }`
- **AND** 10 tasks are ready: 5 "heavy_job" tasks and 5 "light" tasks (no resources)
- **WHEN** execution proceeds
- **THEN** at most 2 "heavy_job" tasks SHALL run.
- **AND** up to 3 "light" tasks MAY run concurrently (totaling 5).
