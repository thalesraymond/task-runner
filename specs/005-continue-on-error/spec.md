# Feature Specification: Continue On Error

**Feature Branch**: `feat-continue-on-error`
**Created**: 2026-01-18
**Status**: Draft

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Non-Critical Task Failure (Priority: P1)

As a workflow designer, I want to mark certain tasks as non-critical so that if they fail, the workflow continues and downstream dependencies still run.

**Why this priority**: Users need flexibility to define resilient workflows where minor failures (e.g., logging, cleanup) do not halt critical path operations.

**Independent Test**: Create a workflow with Task A (continueOnError: true) and Task B (depends on A). Force Task A to fail. Verify that Task B executes.

**Acceptance Scenarios**:

1.  **Given** a task A with `continueOnError: true` and a dependent task B, **When** task A fails, **Then** task B must execute (not be skipped).
2.  **Given** a task A with `continueOnError: false` (default) and a dependent task B, **When** task A fails, **Then** task B must be marked as 'skipped'.
3.  **Given** task A fails (continueOnError: true), **Then** the final results map must show task A as 'failure' and task B as 'success' (assuming B succeeds).

---

### User Story 2 - Mixed Dependency Behavior (Priority: P2)

As a developer, I want `continueOnError` to apply only to the specific task failures, preserving normal dependency rules for other tasks.

**Why this priority**: Ensures precise control over workflow logic.

**Independent Test**: Task A (critical), Task B (non-critical). Task C depends on both.
- If A fails, C skips.
- If B fails, C runs.

**Acceptance Scenarios**:

1.  **Given** Task C depends on A and B, where B is `continueOnError: true`, **When** B fails and A succeeds, **Then** C executes.
2.  **Given** Task C depends on A and B, where B is `continueOnError: true`, **When** A fails, **Then** C is skipped (because A is critical).

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The `TaskStep` interface MUST include an optional `continueOnError` boolean property.
- **FR-002**: The system MUST NOT skip dependents of a failed task if that task has `continueOnError: true`.
- **FR-003**: The system MUST record the status of the failed task as 'failure' regardless of the `continueOnError` setting.
- **FR-004**: The system MUST continue to skip dependents if a task fails and `continueOnError` is false or undefined.

### Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A workflow with a failing non-critical task completes 100% of the time (downstream tasks run), compared to 0% without this feature.
- **SC-002**: Users can implement "best-effort" cleanup steps without risking the primary workflow success.
