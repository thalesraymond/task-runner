## ADDED Requirements
### Requirement: Workflow Dry Run
The `TaskRunner` SHALL support a 'dry run' mode to simulate execution without performing side effects.

#### Scenario: Dry run execution
- **WHEN** `TaskRunner.execute` is called with `dryRun: true`
- **THEN** the runner SHALL traverse the dependency graph and determine the execution order
- **AND** the runner SHALL NOT execute the `run` method of any `TaskStep`.

#### Scenario: Dry run result
- **WHEN** a dry run completes
- **THEN** the returned `TaskResult` map SHALL indicate which tasks would have been run (e.g., status 'success' or a specific 'dry-run' status).

### Requirement: Graph Visualization
The system SHALL provide a mechanism to visualize the dependency graph.

#### Scenario: Mermaid.js generation
- **WHEN** the visualization method is called with a list of `TaskStep`s
- **THEN** it SHALL return a string representation of the graph in Mermaid.js syntax (flowchart).

#### Scenario: Graph representation
- **WHEN** generating the graph
- **THEN** it MUST correctly represent all tasks as nodes and dependencies as directed edges.
