## ADDED Requirements

### Requirement: Matrix Task Execution

The `TaskRunner` SHALL support parameterized task execution via a `matrix` configuration, automatically expanding a single task definition into multiple parallel instances based on permutations of the matrix values.

#### Scenario: Single dimension matrix
- **WHEN** a `TaskStep` defines a `matrix` with a single key and an array of 3 values
- **THEN** the `TaskRunner` SHALL dynamically generate and execute 3 distinct task instances
- **AND** each instance SHALL receive a specific value from the matrix during execution.

#### Scenario: Multi-dimension matrix
- **WHEN** a `TaskStep` defines a `matrix` with multiple keys (e.g., `os: ["ubuntu", "macos"]`, `node: [18, 20]`)
- **THEN** the `TaskRunner` SHALL compute the cartesian product of the matrix values
- **AND** it SHALL dynamically generate and execute a task instance for each permutation (e.g., 4 instances).

#### Scenario: Unique identification of matrix tasks
- **WHEN** the `TaskRunner` expands a matrix task
- **THEN** each generated task MUST have a unique `name` derived from the base task name and its specific matrix parameters.

#### Scenario: Matrix task dependency resolution
- **WHEN** a regular task depends on a task that defines a `matrix`
- **THEN** the dependent task SHALL wait for ALL generated matrix instances to complete successfully before executing.
