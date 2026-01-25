## ADDED Requirements

### Requirement: Composite Task Execution

The `TaskRunner` SHALL support executing `CompositeTaskStep`s, which contain a list of internal `TaskStep`s.

#### Scenario: Successful composite execution
- **GIVEN** a `CompositeTaskStep` with a list of valid internal steps
- **WHEN** the composite task is executed
- **THEN** the `TaskRunner` SHALL execute the internal steps respecting their dependencies.
- **AND** the composite task SHALL succeed only when all internal steps succeed.

#### Scenario: Composite task failure
- **GIVEN** a `CompositeTaskStep` where one internal step fails
- **WHEN** the composite task is executed
- **THEN** the composite task SHALL be marked as failed.
- **AND** subsequent steps depending on the composite task SHALL be skipped.

#### Scenario: Internal Dependencies
- **GIVEN** a `CompositeTaskStep` with internal steps A and B, where B depends on A
- **WHEN** the composite task is executed
- **THEN** step A SHALL execute before step B.

### Requirement: Composite Task Visualization

The Mermaid graph generator SHALL support visualizing `CompositeTaskStep`s as subgraphs.

#### Scenario: Subgraph generation
- **GIVEN** a workflow containing a `CompositeTaskStep`
- **WHEN** `getMermaidGraph` is called
- **THEN** the composite task SHALL be rendered as a `subgraph`.
- **AND** internal steps SHALL be rendered inside the subgraph.
