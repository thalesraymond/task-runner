## ADDED Requirements

### Requirement: Built-in Observability Logging

The system SHALL provide a standardized mechanism to log workflow and task execution events in both human-readable and structured formats.

#### Scenario: CLI Text Logging
- **WHEN** a workflow is executed with the text logger enabled
- **THEN** it SHALL output human-readable lifecycle events (start, success, failure, skip) to the console.

#### Scenario: Structured JSON Logging
- **WHEN** a workflow is executed with the JSON logger enabled
- **THEN** it SHALL output structured JSON objects for each lifecycle event, suitable for machine ingestion.
- **AND** the JSON object SHALL contain task name, timestamp, duration, and status.
