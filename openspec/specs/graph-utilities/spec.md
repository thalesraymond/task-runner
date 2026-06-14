## Purpose

This specification defines the requirements for a set of utilities to validate task graphs and generate Mermaid flowcharts from task definitions. The utilities will ensure that task dependencies are correctly structured and provide clear error reporting for invalid configurations. Additionally, the Mermaid generation utility will allow users to visualize their task graphs in a standardized format.

## Requirements

### Requirement: Task Graph Validation
The system SHALL validate the provided task steps to ensure structural integrity before execution.

#### Scenario: Duplicate task IDs
- **WHEN** multiple tasks share the same ID/name
- **THEN** validation SHALL fail with a duplicate task error.

#### Scenario: Missing dependencies
- **WHEN** a task declares a dependency on a non-existent task ID
- **THEN** validation SHALL fail with a missing dependency error.

#### Scenario: Circular dependencies
- **WHEN** the task graph contains a cycle (e.g., A -> B -> A)
- **THEN** validation SHALL fail with a cycle detected error.

### Requirement: Idiomatic Validation Errors
The system SHALL return structured, queryable error types for validation failures.

#### Scenario: Programmatic error inspection
- **WHEN** validation fails
- **THEN** the caller SHALL be able to use `errors.As` to extract specific details like the cycle path or the missing dependency ID.

### Requirement: Mermaid Graph Generation
The system SHALL provide a utility to generate Mermaid flowchart syntax from task steps.

#### Scenario: Generating a graph
- **WHEN** a valid set of tasks is provided to the Mermaid utility
- **THEN** it SHALL return a valid Mermaid flowchart string representing the dependencies.
- **AND** it SHALL properly sanitize and escape task names to ensure valid Mermaid syntax.
