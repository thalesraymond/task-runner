## ADDED Requirements

### Requirement: Interactive CLI Progress Reporting

The `CLIReporterPlugin` SHALL provide real-time updates of task states during workflow execution.

#### Scenario: Displaying running tasks

- **WHEN** a task starts execution and triggers `taskStart`
- **THEN** the CLI reporter SHALL display the task name with a "running" indicator.

#### Scenario: Displaying successful tasks

- **WHEN** a task finishes successfully and triggers `taskEnd` with a `success` status
- **THEN** the CLI reporter SHALL display the task name with a "success" indicator and execution duration.

#### Scenario: Displaying failed tasks

- **WHEN** a task finishes with an error and triggers `taskEnd` with a `failure` status
- **THEN** the CLI reporter SHALL display the task name with a "failure" indicator and error details.

#### Scenario: Displaying skipped tasks

- **WHEN** a task is skipped due to unmet dependencies or conditions
- **THEN** the CLI reporter SHALL display the task name with a "skipped" indicator.

### Requirement: Workflow Execution Summary

The `CLIReporterPlugin` SHALL display a summary table or block upon completion of the entire task graph execution.

#### Scenario: Generating final summary

- **WHEN** all tasks have resolved (either success, failure, or skipped)
- **THEN** the CLI reporter SHALL output the total execution time, along with counts for successful, failed, and skipped tasks.
