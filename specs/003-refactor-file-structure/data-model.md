# Data Model

This document outlines the key data entities for the Task Runner feature.

## Core Entities

### 1. TaskStatus

- **Type**: Type Alias
- **Description**: Represents the possible completion statuses of a task.
- **Shape**: `'success' | 'failure' | 'skipped'`

---

### 2. TaskResult

- **Type**: Interface
- **Description**: Defines the result object returned by a single task step.
- **Fields**:
  - `status` (`TaskStatus`, required): The final status of the task.
  - `message` (`string`, optional): An optional message, typically for success statuses.
  - `error` (`string`, optional): An optional error message, for failure statuses.
  - `data` (`any`, optional): Optional data produced by the step for later inspection.

---

### 3. TaskStep

- **Type**: Interface (Generic)
- **Description**: Represents a single, executable step within a workflow.
- **Generic Parameter**: `<TContext>` - The shape of the shared context object.
- **Fields**:
  - `name` (`string`, required): A unique identifier for this task step.
  - `dependencies` (`string[]`, optional): A list of task names that must complete successfully before this step can run.
  - `run(context: TContext)` (`Promise<TaskResult>`, required): The core logic of the task.

---

### 4. TaskRunner

- **Type**: Class (Generic)
- **Description**: The main class that orchestrates the execution of a list of tasks based on their dependencies.
- **Generic Parameter**: `<TContext>` - The shape of the shared context object.
- **Properties**:
  - `context` (`TContext`, private): The shared context object passed to each task.
- **Methods**:
  - `constructor(context: TContext)`: Initializes the runner with a shared context.
  - `execute(steps: TaskStep<TContext>[]): Promise<Map<string, TaskResult>>`: Executes the list of task steps.
