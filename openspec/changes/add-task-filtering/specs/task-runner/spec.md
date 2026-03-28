## ADDED Requirements

### Requirement: Task Tagging

The `TaskStep` interface SHALL support an optional `tags` array of strings to categorize the step.

#### Scenario: Categorizing a Task
- **GIVEN** a task configuration
- **WHEN** the `tags` property is defined with an array of string identifiers (e.g., `["frontend", "build"]`)
- **THEN** the task SHALL retain those tags for metadata and filtering operations.

### Requirement: Task Filtering Configuration

The system SHALL provide a mechanism to configure execution filters via an interface `TaskFilterConfig`.

#### Scenario: Filter Config Structure
- **GIVEN** a `TaskFilterConfig` object
- **THEN** it SHALL support:
  - `includeTags`: Optional array of tag strings. Only tasks with at least one matching tag will be included.
  - `excludeTags`: Optional array of tag strings. Tasks with any matching tag will be excluded.
  - `includeNames`: Optional array of task names. Only tasks with matching names will be included.
  - `excludeNames`: Optional array of task names. Tasks with matching names will be excluded.
  - `includeDependencies`: Optional boolean. If true, dependencies of included tasks are automatically included.

### Requirement: Filtering Utility Module

The system SHALL provide a `filterTasks` utility function that accepts an array of `TaskStep`s and a `TaskFilterConfig` and returns a filtered subset of tasks.

#### Scenario: Inclusion Filtering
- **WHEN** `filterTasks` is invoked with `includeTags: ["test"]`
- **THEN** it SHALL return ONLY tasks containing the `"test"` tag.

#### Scenario: Exclusion Filtering
- **WHEN** `filterTasks` is invoked with `excludeNames: ["deploy"]`
- **THEN** it SHALL return all tasks EXCEPT the one named `"deploy"`.

#### Scenario: Dependency Resolution Override
- **WHEN** `filterTasks` is invoked with `includeDependencies: true` and a specific task name is selected
- **THEN** it SHALL return the selected task AND any tasks that the selected task recursively depends on from the original list.

#### Scenario: Exclusion Precedence
- **WHEN** a task is implicitly included because it is a dependency of an explicitly selected task
- **AND** the implicitly included task matches an explicit exclusion criteria (e.g., `excludeTags`)
- **THEN** the explicitly excluded task SHALL NOT be included in the returned array.

### Requirement: Task Execution Filtering Support

The `TaskRunnerExecutionConfig` SHALL support an optional `filter` property of type `TaskFilterConfig`.

#### Scenario: Executing Filtered Tasks
- **WHEN** `TaskRunner.execute` is called with an array of steps and a `filter` in the configuration
- **THEN** the `TaskRunner` SHALL apply the filter to the provided steps.
- **AND** ONLY the filtered subset of steps SHALL be validated and executed.