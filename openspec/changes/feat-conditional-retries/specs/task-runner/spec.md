## ADDED Requirements

### Requirement: Conditional Retries

The system SHALL support conditional retries where a user-defined predicate determines if a task failure warrants a retry attempt.

#### Scenario: Retry allowed by predicate

- **GIVEN** a task configured with retries and a `shouldRetry` predicate
- **WHEN** the task fails with an error
- **AND** the `shouldRetry` predicate returns `true` for that error
- **THEN** the system SHALL proceed with the retry logic (respecting attempt limits and delays).

#### Scenario: Retry denied by predicate

- **GIVEN** a task configured with retries and a `shouldRetry` predicate
- **WHEN** the task fails with an error
- **AND** the `shouldRetry` predicate returns `false` for that error
- **THEN** the system SHALL NOT retry the task.
- **AND** the task status SHALL be immediately marked as 'failure'.

#### Scenario: Default retry behavior

- **GIVEN** a task configured with retries but NO `shouldRetry` predicate
- **WHEN** the task fails with an error
- **THEN** the system SHALL retry the task (respecting attempt limits and delays), preserving backward compatibility.
