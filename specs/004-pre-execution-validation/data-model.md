# Data Model: Task Graph Validation

## Key Entities

### Entity: Task

- **Purpose**: Represents a single unit of work within the task graph.
- **Attributes**:
  - `id`: string - A unique identifier for the task.
  - `dependencies`: string[] - An array of `id`s of other tasks that this task depends on. These tasks must complete before this task can start.
  - `[payload]`: any - (Optional) The specific operation or data associated with this task. Not directly relevant to graph validation but essential for the task's execution.
- **Relationships**:
  - Has a many-to-many relationship with other `Task` entities through its `dependencies` attribute.

### Entity: TaskGraph

- **Purpose**: Represents the overall structure of tasks and their interdependencies, defining the execution flow.
- **Attributes**:
  - `tasks`: Map<string, Task> - A collection of `Task` entities, where each `Task` is uniquely identified by its `id`. Using a map ensures efficient lookup and enforces the uniqueness of task IDs within the graph.
- **Relationships**:
  - Contains multiple `Task` entities.
- **Validation Rules (derived from Functional Requirements)**:
  - **FR-002 (Cycle Detection)**: The `TaskGraph` MUST NOT contain any circular dependencies among `Task` entities.
  - **FR-003 (Missing Dependency Detection)**: For every `Task` in the graph, all `id`s listed in its `dependencies` attribute MUST correspond to an existing `Task` `id` within the `TaskGraph`.
  - **FR-004 (Duplicate Task Detection)**: The `TaskGraph` MUST NOT contain multiple `Task` entities with the same `id`.
