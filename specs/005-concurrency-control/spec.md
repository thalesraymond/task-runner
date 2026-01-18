# Feature Specification: Concurrency Control

**Feature Branch**: `005-concurrency-control`
**Created**: 2026-01-17
**Status**: Draft
**Input**: User description: "Problem: The current implementation executes all independent tasks in parallel. In a large graph with many independent nodes, this could overwhelm system resources (CPU, memory) or hit external API rate limits. Solution: Add a concurrency control mechanism to the runner. Throttle: Limit the number of tasks running simultaneously. Queueing: Maintain a queue of ready tasks and only start them when a slot is available. Config: Add concurrency: number to the RunnerOptions."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Limiting Concurrent Task Execution (Priority: P1)

As a developer, I want to limit the number of tasks that run simultaneously within the `TaskRunner`, so that I can prevent resource exhaustion and respect external API rate limits.

**Why this priority**: This directly addresses the core problem of overwhelming system resources and external services, providing critical stability and control.

**Independent Test**: Create a `TaskRunner` instance with more independent tasks than the configured concurrency limit. Monitor the execution and verify that no more tasks than the specified limit are running at any given moment.

**Acceptance Scenarios**:

1.  **Given** a `TaskRunner` configured with a `concurrency` limit of `N`, and a workflow with `M` (where `M > N`) independent tasks ready for execution, **When** `runAll` is invoked, **Then** at most `N` tasks must be in an 'in-progress' state simultaneously.
2.  **Given** the scenario above, **When** a running task completes, **Then** a new task from the queue of ready tasks must be initiated, if available, maintaining the concurrency limit `N`.
3.  **Given** a workflow where `concurrency` is not specified, **When** `runAll` is invoked, **Then** the `TaskRunner` must default to its current behavior (e.g., executing all independent tasks in parallel without explicit limits).

---

### User Story 2 - Managing a Queue of Ready Tasks (Priority: P2)

As a developer, I want the `TaskRunner` to intelligently queue tasks that are ready to run but cannot yet due to concurrency limits, so that task execution is managed efficiently without manual intervention.

**Why this priority**: This ensures smooth operation and proper task flow when concurrency limits are in place, making the throttling mechanism effective.

**Independent Test**: Create a `TaskRunner` instance with a concurrency limit and a mix of dependent and independent tasks. Observe that tasks whose dependencies are met enter a 'ready' state and are queued, and then executed as concurrency slots become available.

**Acceptance Scenarios**:

1.  **Given** a `TaskRunner` with a `concurrency` limit, **When** a task's dependencies are met, but the concurrency limit has been reached, **Then** the task must transition to a 'queued' or 'ready-to-run' internal state and wait for an available slot.
2.  **Given** a task in a 'queued' state, **When** a slot becomes available (i.e., a running task completes), **Then** the queued task must be started by the `TaskRunner`.

### Edge Cases

-   What happens if `concurrency` is set to a negative number? It should be treated as an invalid configuration, perhaps defaulting to unlimited or throwing an error.
-   How does concurrency control interact with task cancellation (via `AbortSignal` or `timeout`)? A cancelled task should free up a concurrency slot.
-   What if all tasks in the queue are blocked by a single long-running task at the concurrency limit? The system should continue to wait for that task to complete or for cancellation.

## Requirements _(mandatory)_

### Functional Requirements

-   **FR-001**: The `TaskRunner`'s `execute` (or `runAll`) method's configuration object (`TaskRunnerConfig`) MUST accept an optional `concurrency` property of type `number`.
-   **FR-002**: When `concurrency` is specified and is a positive number, the `TaskRunner` MUST ensure that no more than `concurrency` tasks are in an 'in-progress' state simultaneously.
-   **FR-003**: When `concurrency` is not specified or is set to `Infinity`, the `TaskRunner` MUST execute all independent tasks in parallel (default behavior, unlimited concurrency).
-   **FR-004**: Tasks whose dependencies are met but cannot start due to `concurrency` limits MUST be held in an internal queue.
-   **FR-005**: Upon completion or cancellation of a running task, a slot must be freed, and if the queue is not empty, a task from the queue must be moved to an 'in-progress' state.
-   **FR-006**: The concurrency control mechanism MUST be compatible with the existing cancellation (`AbortSignal`, `timeout`) and dependency management features.
-   **FR-007**: A `concurrency` value of `0` MUST be interpreted as unlimited concurrency.
-   **FR-008**: A `concurrency` value less than `0` (negative) MUST be treated as an invalid configuration, leading to an error or defaulting to unlimited concurrency. (Decision to be made during implementation or further refinement).

### Key Entities _(include if feature involves data)_

-   **TaskRunner**: The existing entity, which will be enhanced with concurrency management logic.
-   **TaskRunnerConfig**: The existing configuration entity for `runAll`, which will gain a new `concurrency` property.
-   **Task Queue**: An internal data structure within `TaskRunner` to hold tasks ready for execution but pending a free concurrency slot.

## Success Criteria _(mandatory)_

### Measurable Outcomes

-   **SC-001**: For a workflow with 10 independent tasks each taking 1 second, and a `concurrency` limit of 2, the total execution time (from `runAll` start to all tasks complete) MUST be approximately 5 seconds (+/- 100ms for overhead).
-   **SC-002**: During the execution of a workflow with a `concurrency` limit `N`, monitoring tools (or internal logging) MUST never report more than `N` tasks simultaneously in an 'in-progress' state.
-   **SC-003**: When `concurrency` is set to `Infinity` or `0`, the execution pattern of independent tasks MUST be identical to the pre-concurrency-control implementation (i.e., all independent tasks run in parallel).
-   **SC-004**: The introduction of concurrency control MUST NOT increase the execution time of a workflow with a single, linear dependency chain by more than 5% (assuming `concurrency` is not a bottleneck for this type of graph).