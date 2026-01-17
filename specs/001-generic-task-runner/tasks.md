# Tasks: Generic Task Runner

**Input**: Design documents from `/home/thales/projects/task-runner/specs/001-generic-task-runner/`
**Prerequisites**: plan.md, spec.md, data-model.md

**Tests**: Test tasks are included as per the project constitution, which mandates a test-first approach.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Paths assume a single project structure: `src/` and `tests/` at the repository root.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic file structure.

- [x] T001 Configure `vitest` in `vitest.config.ts` to collect coverage data.
- [x] T002 Create the main library file at `src/index.ts`.
- [x] T003 Create the test file at `tests/index.test.ts`.

---

## Phase 2: User Story 1 - Sequential Execution (Priority: P1) 🎯 MVP

**Goal**: Implement a basic, sequential task runner that respects dependencies.
**Independent Test**: A chain of tasks (A -> B -> C) executes in the correct order.

### Tests for User Story 1 (Write these tests FIRST) ⚠️

- [x] T004 [US1] In `tests/index.test.ts`, write a failing test for a simple sequential workflow (e.g., Task B depends on Task A, A should run before B).
- [x] T005 [P] [US1] In `tests/index.test.ts`, write a failing test to ensure the runner handles an empty list of tasks gracefully.

### Implementation for User Story 1

- [x] T006 [P] [US1] In `src/index.ts`, define and export the core types: `TaskStatus`, `TaskResult`, and `TaskStep`.
- [x] T007 [US1] In `src/index.ts`, implement the initial `TaskRunner` class with a simple, sequential execution loop that satisfies the tests in T004 and T005.

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently.

---

## Phase 3: User Story 2 - Parallel Execution (Priority: P2)

**Goal**: Enhance the runner to execute independent tasks concurrently.
**Independent Test**: Two independent tasks (A and B) are initiated at the same time, and a task C that depends on both only starts after both are complete.

### Tests for User Story 2 (Write these tests FIRST) ⚠️

- [x] T008 [US2] In `tests/index.test.ts`, write a failing test demonstrating that two independent tasks are executed in parallel.

### Implementation for User Story 2

- [x] T009 [US2] In `src/index.ts`, refactor the `TaskRunner.execute` method to identify and run all dependency-free, eligible steps in parallel using `Promise.all()`.
- [x] T010 [P] [US2] In `src/index.ts`, add a `private running = new Set<string>()` property to the `TaskRunner` class to track in-flight tasks and prevent duplicate executions.

**Checkpoint**: User Story 2 functionality should now be integrated, and all previous tests should still pass.

---

## Phase 4: User Story 3 - Failure & Skipping (Priority: P3)

**Goal**: Implement robust error handling, including skipping dependent tasks and detecting circular dependencies.
**Independent Test**: A task chain (A -> B) is created, A is forced to fail, and B is verified to have a 'skipped' status. A circular dependency (A -> B, B -> A) throws an error.

### Tests for User Story 3 (Write these tests FIRST) ⚠️

- [x] T011 [US3] In `tests/index.test.ts`, write a failing test where a root task fails, and assert that its dependent tasks are marked as 'skipped'.
- [x] T012 [P] [US3] In `tests/index.test.ts`, write a failing test where a circular dependency is defined, and assert that the `execute` method throws an error.

### Implementation for User Story 3

- [x] T013 [US3] In `src/index.ts`, add logic to the `TaskRunner` to identify and mark tasks as 'skipped' if one of their dependencies has a status of 'failure' or 'skipped'.
- [x] T014 [US3] In `src/index.ts`, add the deadlock detection mechanism to the `TaskRunner`'s main loop to throw an error when no tasks can be run, but the process is not yet complete.

**Checkpoint**: All user stories should now be independently functional and all tests should pass.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Finalize documentation and ensure code quality.

- [x] T015 [P] Add JSDoc comments to all public APIs (`TaskStatus`, `TaskResult`, `TaskStep`, `TaskRunner`) in `src/index.ts` as per the constitution.
- [x] T016 Review the `TaskRunner` implementation in `src/index.ts` for clarity, performance, and adherence to SOLID principles.
- [x] T017 Run `pnpm test -- --coverage` and add or modify tests in `tests/index.test.ts` until 100% test coverage is achieved.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: User Story 1
3. **STOP and VALIDATE**: All US1 tests must pass. The core sequential runner is now ready.

### Incremental Delivery

1.  Complete MVP -> Foundation ready.
2.  Add User Story 2 -> Test independently -> Parallel execution is now supported.
3.  Add User Story 3 -> Test independently -> Robust error handling is now supported.
4.  Complete Polish phase.
