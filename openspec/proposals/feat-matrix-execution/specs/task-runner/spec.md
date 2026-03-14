## ADDED Requirements

### Requirement: Matrix Execution Configuration

The `TaskStep` interface SHALL support an optional `matrix` configuration property to enable parameterized execution.

#### Scenario: Matrix configuration structure

- **GIVEN** a `TaskStep` definition
- **THEN** it SHALL support a `matrix` property defined as a mapping of variable names to arrays of values (e.g., `Record<string, any[]>`).

### Requirement: Matrix Permutation Expansion

The `TaskRunner` engine SHALL dynamically expand a task with a `matrix` configuration into multiple independent task instances.

#### Scenario: Single dimension matrix

- **WHEN** a task defines a single dimension matrix (e.g., `matrix: { env: ['dev', 'prod'] }`)
- **THEN** the engine SHALL generate independent task instances for each value.

#### Scenario: Multi-dimensional matrix

- **WHEN** a task defines a multi-dimensional matrix (e.g., `matrix: { os: ['linux', 'windows'], node: [18, 20] }`)
- **THEN** the engine SHALL generate independent task instances for every combination (Cartesian product) of the matrix dimensions.

### Requirement: Contextual Matrix Variables

The `TaskRunner` SHALL provide the matrix permutation values to the execution context of the generated child tasks.

#### Scenario: Accessing matrix variables

- **WHEN** a child matrix task is executed for a permutation like `{ os: 'linux', node: 18 }`
- **THEN** its `run` function SHALL be able to access the permutation values via the context (e.g., `context.matrix.os` would be `'linux'` and `context.matrix.node` would be `18`).

### Requirement: Matrix Dependency Resolution

The `TaskRunner` SHALL correctly resolve dependencies involving matrix tasks.

#### Scenario: Depending on a matrix task

- **WHEN** a standard task depends on a matrix task
- **THEN** the standard task SHALL wait for all child tasks of the matrix to complete successfully before executing.

#### Scenario: Matrix task dependencies

- **WHEN** a matrix task depends on another task
- **THEN** all generated child tasks of the matrix SHALL wait for the parent task to complete before executing.
