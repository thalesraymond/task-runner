## ADDED Requirements

### Requirement: Dry Run Execution Strategy

The system SHALL provide a `DryRunExecutionStrategy` that implements `IExecutionStrategy`.

#### Scenario: Simulating execution

- **WHEN** `WorkflowExecutor` is configured with `DryRunExecutionStrategy`
- **AND** `execute` is called
- **THEN** it SHALL traverse the dependency graph respecting order
- **AND** it SHALL NOT execute the actual work of the `TaskStep`.
- **AND** it SHALL return `TaskResult`s with a status indicating successful simulation (e.g., `simulated` or `success`).

### Requirement: Mermaid Visualization

The system SHALL provide a utility to generate a Mermaid.js graph from task steps.

#### Scenario: Generate Mermaid Graph

- **GIVEN** a list of `TaskStep`s with dependencies
- **WHEN** `generateMermaidGraph` is called
- **THEN** it SHALL return a valid Mermaid flowchart syntax string.
- **AND** dependencies SHALL be represented as arrows (`-->`).
- **AND** independent tasks SHALL appear as nodes.
