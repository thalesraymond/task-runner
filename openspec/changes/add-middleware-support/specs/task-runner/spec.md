## ADDED Requirements

### Requirement: Global Middleware Support

The system SHALL support registering global middleware functions that intercept and wrap the execution of every `TaskStep`.

#### Scenario: Middleware Execution Order

- **GIVEN** a `TaskRunner` with two middleware functions: `A` (outer) and `B` (inner)
- **WHEN** a task is executed
- **THEN** `A` runs before `B`
- **AND** `B` runs before the task strategy
- **AND** the task strategy runs
- **AND** `B` runs after the task strategy
- **AND** `A` runs after `B`.

#### Scenario: Modifying Task Result

- **GIVEN** a middleware that modifies the returned result
- **WHEN** a task completes successfully
- **THEN** the final result stored in the runner MUST match the result returned by the middleware.

#### Scenario: Blocking Execution

- **GIVEN** a middleware that returns a result _without_ calling `next()`
- **WHEN** the task is scheduled
- **THEN** the task strategy SHALL NOT be executed
- **AND** the task result SHALL be the one returned by the middleware.

#### Scenario: Context Access

- **GIVEN** a middleware function
- **WHEN** it is invoked
- **THEN** it SHALL have access to the current `TaskStep` and shared `context`.
