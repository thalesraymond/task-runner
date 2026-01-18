# Data Model: Task Cancellation

This document outlines the key entities and their relationships for the Task Cancellation feature, derived from the feature specification.

## Entities

### `TaskRunner`

The existing orchestrator for managing and executing `TaskStep`s. This entity will be enhanced to incorporate cancellation logic.

-   **New/Modified Methods**: `runAll(config?: TaskRunnerConfig)` - The `runAll` method will be updated to accept an optional `TaskRunnerConfig` object.
-   **Internal State**: Will manage an internal `AbortController` to handle global timeout and propagate external `AbortSignal`.

### `TaskRunnerConfig`

A new entity representing the optional configuration object passed to the `TaskRunner.runAll` method.

-   **AbortSignal**: `signal` (AbortSignal, optional) - A standard Web API `AbortSignal` instance that can be used to externally cancel the entire workflow.
-   **Timeout**: `timeout` (number, optional) - A global timeout in milliseconds after which the `TaskRunner` will automatically cancel the workflow.

### `AbortSignal`

A standard Web API interface (part of `AbortController`) used to signal or request that an operation be aborted.

-   **Properties**: `aborted` (boolean) - Indicates if the signal has been aborted.
-   **Events**: Emits an `abort` event when the operation is cancelled.

### `AbortController`

A standard Web API interface that allows you to create and manage an `AbortSignal`.

-   **Methods**: `abort()` - Triggers the `abort` event on its associated `AbortSignal`.
-   **Properties**: `signal` (AbortSignal) - The `AbortSignal` associated with this controller.

## Relationships

-   A `TaskRunner` instance will optionally accept a `TaskRunnerConfig` when its `runAll` method is invoked.
-   `TaskRunnerConfig` may contain an `AbortSignal` and/or a `timeout`.
-   The `TaskRunner` will internally manage `AbortSignal`s to coordinate cancellation from external sources or due to a global timeout.
-   Individual `TaskStep`s may receive an `AbortSignal` (via their `run` method or context) to allow them to respond to cancellation requests gracefully.
-   The `TaskRunner` will need to listen for `abort` events on the provided `AbortSignal` (if any) and its internally managed `AbortSignal` for timeouts.
