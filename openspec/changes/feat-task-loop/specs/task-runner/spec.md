## ADDED Requirements

### Requirement: Task Loop Execution

The system SHALL support re-executing a task based on a polling configuration until a condition is met.

#### Scenario: Successful loop completion
- **GIVEN** a task with `loop` configuration and a condition that eventually returns true
- **WHEN** the task executes and the condition initially returns false
- **THEN** it SHALL wait for the specified `interval`.
- **AND** it SHALL re-execute the task.
- **AND** it SHALL stop re-executing when the condition returns true.

#### Scenario: Loop timeout (max iterations)
- **GIVEN** a task with `loop` configuration
- **WHEN** the `maxIterations` limit is reached without the condition becoming true
- **THEN** it SHALL return the last result (or a specific failure status).

#### Scenario: Predicate evaluation
- **WHEN** checking the `until` predicate
- **THEN** the system SHALL pass the current `Context` and the latest `TaskResult` to the function.
