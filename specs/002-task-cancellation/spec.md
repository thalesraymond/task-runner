# Feature Specification: Task Cancellation

**Feature Branch**: `002-task-cancellation`
**Created**: 2026-01-17
**Status**: Draft
**Input**: User description: "Problem: Once TaskRunner.execute() is called, there is no way to cancel the operation externally. If a task hangs or if the user wants to abort the workflow (e.g., in a CLI or UI context), the runner continues until completion or failure. Solution: Update the execute method to accept an optional configuration object supporting AbortSignal and a global timeout."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - External Cancellation via AbortSignal (Priority: P1)

As a developer, I want to be able to externally cancel a running `TaskRunner` operation, so that I can provide users with the ability to abort long-running or unresponsive workflows.

**Why this priority**: This is the core problem described – the inability to cancel. Providing an `AbortSignal` mechanism is a standard, robust way to address this.

**Independent Test**: Create a `TaskRunner` instance with a long-running task. Initiate the `runAll` method with an `AbortSignal`. Trigger the `AbortSignal` after a short delay and verify that the long-running task is interrupted, and subsequent tasks are not executed.

**Acceptance Scenarios**:

1.  **Given** a `TaskRunner` instance with a long-running task and an `AbortController`, **When** `runAll` is called with `AbortSignal.signal`, and **When** `AbortController.abort()` is called during the long-running task, **Then** the long-running task must be interrupted.
2.  **Given** the scenario above, **When** `AbortController.abort()` is called, **Then** any tasks that were not yet started must be marked as cancelled/skipped.
3.  **Given** a `TaskRunner` instance where `AbortSignal` is provided, **When** `AbortSignal` is already aborted before `runAll` is called, **Then** `runAll` should immediately return with all tasks marked as cancelled/skipped without executing any tasks.

---

### User Story 2 - Global Timeout for Workflow (Priority: P2)

As a developer, I want to set a global timeout for the entire `TaskRunner` workflow, so that tasks do not hang indefinitely and consume resources, ensuring a predictable maximum execution time.

**Why this priority**: This provides a safeguard against unforeseen issues (e.g., hanging tasks, external service timeouts) and improves the reliability of automated workflows.

**Independent Test**: Create a `TaskRunner` instance with a task that deliberately exceeds a defined global timeout. Initiate the `runAll` method with the global timeout configuration and verify that the workflow terminates after the specified time, and remaining tasks are not executed.

**Acceptance Scenarios**:

1.  **Given** a `TaskRunner` instance with a task exceeding the configured global timeout, **When** `runAll` is called with a `timeout` option, **Then** the `TaskRunner` must stop execution after the specified timeout duration.
2.  **Given** the scenario above, **When** the global timeout is reached, **Then** any currently running task must be interrupted (if possible, gracefully), and all unstarted tasks must be marked as cancelled/skipped.
3.  **Given** a `TaskRunner` with a global timeout, **When** all tasks complete successfully before the timeout, **Then** the `TaskRunner` must complete normally without being affected by the timeout.

### Edge Cases

-   What happens if both `AbortSignal` and `globalTimeout` are provided, and `AbortSignal` is triggered before the timeout? The `AbortSignal` should take precedence, and the workflow should cancel.
-   What happens if both `AbortSignal` and `globalTimeout` are provided, and the `globalTimeout` is reached before `AbortSignal` is triggered? The `globalTimeout` should take precedence, and the workflow should cancel.
-   How does `TaskRunner` propagate the cancellation to individual `TaskStep`s (e.g., via `AbortSignal` passed to the `run` method of `TaskStep`)?
-   What is the behavior if a `TaskStep` itself tries to catch or ignore the cancellation signal? The `TaskRunner` should still ensure the overall workflow terminates.

## Requirements _(mandatory)_

### Functional Requirements

-   **FR-001**: The `TaskRunner`'s `execute` (or `runAll`) method MUST accept an optional configuration object.
-   **FR-002**: The configuration object MUST support an `AbortSignal` instance.
-   **FR-003**: When an `AbortSignal` is triggered, the `TaskRunner` MUST immediately cease execution of pending tasks.
-   **FR-004**: When an `AbortSignal` is triggered, any currently executing task MUST receive the `AbortSignal` (e.g., via its `run` method or context) to allow for graceful interruption.
-   **FR-005**: The configuration object MUST support a `timeout` property (in milliseconds) for a global workflow timeout.
-   **FR-006**: When the global `timeout` is reached, the `TaskRunner` MUST cease execution of pending tasks.
-   **FR-007**: When the global `timeout` is reached, any currently executing task MUST receive a cancellation signal (e.g., via `AbortSignal` or similar mechanism) to allow for graceful interruption.
-   **FR-008**: All tasks that are not executed due to `AbortSignal` or `timeout` MUST be marked with a 'cancelled' status. Tasks skipped due to dependency failures should retain the 'skipped' status.
-   **FR-009**: If both `AbortSignal` and `timeout` are provided, the first event (abort or timeout) to occur MUST trigger the cancellation.

### Key Entities _(include if feature involves data)_

-   **TaskRunner**: The existing entity, which will be enhanced to handle cancellation.
-   **TaskRunnerConfig**: A new entity representing the optional configuration object for the `runAll` method, containing `AbortSignal` and `timeout` properties.
-   **AbortSignal**: The standard Web API interface used to signal or request that an operation be aborted.
-   **AbortController**: The standard Web API interface used to create and manage an `AbortSignal`.

## Success Criteria _(mandatory)_

### Measurable Outcomes

-   **SC-001**: A `TaskRunner` workflow with a 5-second long-running task, when cancelled via `AbortSignal` after 1 second, MUST terminate within 100ms of the signal being triggered.
-   **SC-002**: A `TaskRunner` workflow with tasks totaling 10 seconds of execution, when configured with a 3-second global timeout, MUST terminate within 200ms of the timeout duration being reached.
-   **SC-003**: After cancellation (either by `AbortSignal` or `timeout`), all unstarted tasks in the workflow MUST have a 'cancelled' status in the final `TaskStepResult` array.
-   **SC-004**: The integration of cancellation mechanisms MUST NOT introduce more than 5% overhead to the execution time of a successfully completing workflow (without cancellation).