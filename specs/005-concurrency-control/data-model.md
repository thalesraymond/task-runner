# Data Model: Concurrency Control

This document outlines the key entities and their relationships for the Concurrency Control feature, derived from the feature specification.

## Entities

### `TaskRunner`

The existing orchestrator for managing and executing `TaskStep`s. This entity will be enhanced to incorporate concurrency control logic.

-   **New/Modified Methods**: `runAll(config?: TaskRunnerConfig)` - The `runAll` method will manage the execution of tasks based on the `concurrency` limit.
-   **Internal State**: Will manage a `Task Queue` and track currently running tasks to enforce the concurrency limit.

### `TaskRunnerConfig`

The existing configuration object passed to the `TaskRunner.runAll` method.

-   **Concurrency**: `concurrency` (number, optional) - A new property that defines the maximum number of tasks that can run simultaneously. A value of `0` or `Infinity` will signify unlimited concurrency.

### `Task Queue`

An internal data structure within `TaskRunner` to hold tasks that are ready to execute (i.e., their dependencies are met) but are currently waiting for an available concurrency slot.

-   **Behavior**: Tasks are added to the queue when ready but unable to run due to concurrency limits. Tasks are removed from the queue and started when a slot becomes available.
-   **Ordering**: Typically FIFO (First-In, First-Out), though other strategies could be considered for future enhancements if needed.

## Relationships

-   A `TaskRunner` instance will optionally accept a `TaskRunnerConfig` containing the `concurrency` limit when its `runAll` method is invoked.
-   The `TaskRunner` will utilize a `Task Queue` to manage tasks awaiting execution due to concurrency constraints.
-   The `TaskRunner` will monitor the number of currently active tasks and pull from the `Task Queue` when slots become available.
-   The concurrency control mechanism will need to interact seamlessly with existing dependency management and cancellation features.
