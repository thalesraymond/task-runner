---
description: 'Task list for Concurrency Control feature implementation'
---

# Tasks: Concurrency Control

**Input**: Design documents from `/specs/005-concurrency-control/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Test tasks are included as explicitly requested by the feature specification's independent test sections and success criteria.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Ensure fundamental project environment and tools are ready.

- [ ] T001 Ensure development environment is configured for TypeScript 5.9.3 and Node.js.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure changes that MUST be complete before concurrency control logic for any user story can be implemented.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T002 Update `src/TaskRunnerConfig.ts` to add an optional `concurrency` property of type `number` (FR-001).

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Limiting Concurrent Task Execution (Priority: P1) 🎯 MVP

**Goal**: Limit the number of tasks that run simultaneously within the `TaskRunner`.

**Independent Test**: Create a `TaskRunner` instance with more independent tasks than the configured concurrency limit. Monitor the execution and verify that no more tasks than the specified limit are running at any given moment.

### Tests for User Story 1 (OPTIONAL - only if tests requested) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T003 [P] [US1] Add unit tests for `TaskRunner` ensuring maximum `N` tasks run concurrently (SC-002) in `tests/TaskRunner.test.ts`.
- [ ] T004 [P] [US1] Add integration tests for `TaskRunner` verifying total execution time with concurrency limits (SC-001) in `tests/ComplexScenario.test.ts`.

### Implementation for User Story 1

- [ ] T005 [US1] Implement a mechanism within `TaskRunner` to track the number of currently running tasks.
- [ ] T006 [US1] Modify `TaskRunner`'s execution logic to limit simultaneously running tasks to the configured `concurrency` value when `concurrency` is a positive number (FR-002).
- [ ] T007 [US1] Implement default behavior for `concurrency` when not specified, or set to 0 or `Infinity` (FR-003, FR-007).

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Managing a Queue of Ready Tasks (Priority: P2)

**Goal**: Manage tasks that are ready to run but cannot yet due to concurrency limits using an internal queue.

**Independent Test**: Create a `TaskRunner` instance with a concurrency limit and a mix of dependent and independent tasks. Observe that tasks whose dependencies are met enter a 'ready' state and are queued, and then executed as concurrency slots become available.

### Tests for User Story 2 (OPTIONAL - only if tests requested) ⚠️

- [ ] T008 [P] [US2] Add unit tests for task queueing and dequeuing behavior in `tests/TaskRunner.test.ts`.
- [ ] T009 [P] [US2] Add integration tests for scenarios involving a mix of dependent/independent tasks and queue management in `tests/ComplexScenario.test.ts`.

### Implementation for User Story 2

- [ ] T010 [US2] Implement an internal `Task Queue` data structure within `TaskRunner` to hold tasks whose dependencies are met but cannot start due to concurrency limits (FR-004).
- [ ] T011 [US2] Implement logic to pull tasks from the `Task Queue` and start them when a concurrency slot becomes available upon completion or cancellation of a running task (FR-005).

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Address remaining edge cases, ensure robustness, and update documentation.

- [ ] T012 Handle edge cases: Validate `concurrency` input (e.g., negative, non-integer values) and ensure robust behavior.
- [ ] T013 Ensure concurrency control is compatible with existing cancellation (`AbortSignal`, `timeout`) (FR-006). A cancelled task should free up a concurrency slot.
- [ ] T014 Update JSDoc documentation for `TaskRunner` class, `runAll` method, and `TaskRunnerConfig` interface (specifically the new `concurrency` property).
- [ ] T015 Verify code coverage for all new and modified concurrency control logic in `src/TaskRunner.ts` and `src/TaskRunnerConfig.ts`.
- [ ] T016 Verify that the introduction of concurrency control does not increase the execution time of a workflow with a single, linear dependency chain by more than 5% (SC-004).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories.
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Depends on User Story 1's concurrency limiting mechanism to create the queueing scenario.

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All test tasks marked [P] can run in parallel within their respective user stories.
- Once Foundational phase completes, User Story 1 and User Story 2 implementation tasks can be partially parallelized.

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Add unit tests for TaskRunner ensuring maximum N tasks run concurrently (SC-002) in tests/TaskRunner.test.ts"
Task: "Add integration tests for TaskRunner verifying total execution time with concurrency limits (SC-001) in tests/ComplexScenario.test.ts"

# Example of parallel implementation for interfaces related to US1:
# Task: "Update src/TaskRunnerConfig.ts to add an optional concurrency property of type number" (part of Foundational, can be done before US1 implementation)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 2
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
