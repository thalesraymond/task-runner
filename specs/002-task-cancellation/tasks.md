---
description: 'Task list for Task Cancellation feature implementation'
---

# Tasks: Task Cancellation

**Input**: Design documents from `/specs/002-task-cancellation/`
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

- [ ] T001 Ensure `AbortController` and `AbortSignal` are available in the target Node.js environment or consider polyfill if targeting older environments.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure changes that MUST be complete before cancellation logic for any user story can be implemented.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T002 Create `src/TaskRunnerConfig.ts` to define the `TaskRunnerConfig` interface (from data-model.md).
- [ ] T003 Update `src/TaskStatus.ts` to include `'cancelled'` status (from contracts/api.ts).
- [ ] T004 Update `src/TaskStep.ts` to modify the `run` method signature to accept `AbortSignal` as the second argument (from contracts/api.ts).
- [ ] T005 Update `src/TaskRunner.ts` to modify the `runAll` method signature to accept an optional `TaskRunnerConfig` object (from contracts/api.ts).

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - External Cancellation via AbortSignal (Priority: P1) 🎯 MVP

**Goal**: Enable external cancellation of a `TaskRunner` workflow using `AbortSignal`.

**Independent Test**: Create a `TaskRunner` instance with a long-running task. Initiate the `runAll` method with an `AbortSignal`. Trigger the `AbortSignal` after a short delay and verify that the long-running task is interrupted, and subsequent tasks are not executed.

### Tests for User Story 1 (OPTIONAL - only if tests requested) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T006 [P] [US1] Add unit test for `AbortSignal` stopping pending tasks in `tests/TaskRunner.test.ts`.
- [ ] T007 [P] [US1] Add unit test for `AbortSignal` propagating to `TaskStep.run` method in `tests/TaskRunner.test.ts`.
- [ ] T008 [P] [US1] Add unit test for unstarted tasks marked 'cancelled' upon `AbortSignal` trigger in `tests/TaskRunner.test.ts`.
- [ ] T009 [P] [US1] Add unit test for pre-aborted `AbortSignal` immediately returning 'cancelled' tasks in `tests/TaskRunner.test.ts`.
- [ ] T010 [P] [US1] Add integration test for `AbortSignal` cancellation with a complex scenario in `tests/ComplexScenario.test.ts`.

### Implementation for User Story 1

- [ ] T011 [US1] Implement `AbortSignal` listener within `TaskRunner` to react to cancellation requests.
- [ ] T012 [US1] Modify `TaskRunner` to pass the `AbortSignal` to individual `TaskStep` `run` methods.
- [ ] T013 [US1] Update `TaskRunner` to mark tasks as 'cancelled'/'skipped' that were not yet started when `AbortSignal` is triggered.
- [ ] T014 [US1] Implement logic in `TaskRunner` to handle an already aborted `AbortSignal` before starting execution.

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Global Timeout for Workflow (Priority: P2)

**Goal**: Implement a global timeout mechanism for the entire `TaskRunner` workflow.

**Independent Test**: Create a `TaskRunner` instance with a task that deliberately exceeds a defined global timeout. Initiate the `runAll` method with the global timeout configuration and verify that the workflow terminates after the specified time, and remaining tasks are not executed.

### Tests for User Story 2 (OPTIONAL - only if tests requested) ⚠️

- [ ] T015 [P] [US2] Add unit test for global `timeout` mechanism stopping workflow in `tests/TaskRunner.test.ts`.
- [ ] T016 [P] [US2] Add unit test for `timeout` propagating cancellation to `TaskStep.run` in `tests/TaskRunner.test.ts`.
- [ ] T017 [P] [US2] Add unit test for unstarted tasks marked 'cancelled' upon `timeout` in `tests/TaskRunner.test.ts`.
- [ ] T018 [P] [US2] Add integration test for `timeout` cancellation with a complex scenario in `tests/ComplexScenario.test.ts`.

### Implementation for User Story 2

- [ ] T019 [US2] Implement global `timeout` mechanism in `TaskRunner` using an internal `AbortController`.
- [ ] T020 [US2] Ensure currently executing tasks receive cancellation signal (from internal `AbortController`) upon `timeout`.

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Address remaining edge cases, ensure robustness, and update documentation.

- [ ] T021 Handle edge case: `AbortSignal` vs. `timeout` precedence, ensuring the first event triggers cancellation (FR-009).
- [ ] T022 Update JSDoc documentation for `TaskRunner` class, `runAll` method, `TaskStep` interface, `run` method, and `TaskRunnerConfig` interface (FR-001, FR-004).
- [ ] T023 Verify code coverage for all new and modified cancellation logic in `src/TaskRunner.ts` and `src/TaskStep.ts`.

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

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Integrates with US1's `AbortSignal` propagation.

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All test tasks marked [P] can run in parallel within their respective user stories.
- Once Foundational phase completes, User Story 1 and User Story 2 implementation tasks can be partially parallelized, especially the test writing.

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Add unit test for AbortSignal stopping pending tasks in tests/TaskRunner.test.ts"
Task: "Add unit test for AbortSignal propagating to TaskStep.run method in tests/TaskRunner.test.ts"
Task: "Add unit test for unstarted tasks marked 'cancelled' upon AbortSignal trigger in tests/TaskRunner.test.ts"
Task: "Add unit test for pre-aborted AbortSignal immediately returning 'cancelled' tasks in tests/TaskRunner.test.ts"
Task: "Add integration test for AbortSignal cancellation with a complex scenario in tests/ComplexScenario.test.ts"

# Example of parallel implementation for models/interfaces related to US1:
# Task: "Create src/TaskRunnerConfig.ts to define the TaskRunnerConfig interface" (part of Foundational, can be done before US1 implementation)
# Task: "Update src/TaskStatus.ts to include 'cancelled' status" (part of Foundational)
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
