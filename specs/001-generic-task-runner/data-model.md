# Data Model: Generic Task Runner

This document outlines the core data structures for the Task Runner library.

## Entities

### `TaskStatus` (Enum)

A string literal type that represents the state of a task.

*   **Type**: `'success' | 'failure' | 'skipped'`

### `TaskResult` (Interface)

An object representing the outcome of a single task execution.

*   **Fields**:
    *   `status` (`TaskStatus`): The mandatory completion status of the task.
    *   `message` (`string`, optional): An optional message providing more details on a successful task.
    *   `error` (`string`, optional): An optional error message if the task failed.
    *   `data` (`any`, optional): Any optional data produced by the step that might be useful for inspection after the run.

### `TaskStep<TContext>` (Interface)

A generic interface representing a single, executable step in the workflow.

*   **Generic Parameter**:
    *   `TContext`: The shape of the shared context object.
*   **Fields**:
    *   `name` (`string`): A unique identifier for the task.
    *   `dependencies` (`string[]`, optional): A list of task `name`s that must complete successfully before this task can run.
    *   `run(context: TContext)` (`Promise<TaskResult>`): The function to be executed for this task. It receives the shared context and must return a `TaskResult`.

### `TaskRunner<TContext>` (Class)

The main class that orchestrates the execution of the tasks.

*   **Generic Parameter**:
    *   `TContext`: The shape of the shared context object.
*   **Properties**:
    *   `context` (`TContext`): The shared context object.
    *   `results` (`Map<string, TaskResult>`): Internal storage for the results of completed tasks.
    *   `running` (`Set<string>`): Internal set to track tasks currently in execution to prevent duplicates.
*   **Methods**:
    *   `execute(steps: TaskStep<TContext>[])`: The main public method that starts the execution of all tasks. Returns a promise that resolves with the map of all task results.

### `Context` (Generic Placeholder)

This is not a concrete entity but a generic placeholder (`TContext`) that the user of the library provides. It is an object that can be of any shape, allowing users to pass arbitrary data and state through their workflow.
