# Tasks: Pre-validation: Validate the graph (cycles, missing deps, duplicates) before execution starts.

**Input**: Design documents from `/specs/004-pre-execution-validation/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: This feature's specification includes "Independent Test" and "Acceptance Scenarios," implying that tests are required.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root

---

## Phase 1: Setup (Basic Structure and Definitions)

**Purpose**: Establish the foundational files and interfaces for the validation feature.

- [ ] T001 Create `TaskGraphValidator` class file in `src/TaskGraphValidator.ts`
- [ ] T002 Create test file for `TaskGraphValidator` in `tests/TaskGraphValidator.test.ts`
- [ ] T003 [P] Copy `Task` and `TaskGraph` interfaces to `src/validation-contracts.ts` and import them into `src/TaskGraphValidator.ts`.
- [ ] T004 [P] Copy `ValidationError` and `ValidationResult` interfaces to `src/validation-contracts.ts` and import them into `src/TaskGraphValidator.ts`.
- [ ] T005 Define the `ITaskGraphValidator` interface in `src/TaskGraphValidator.ts` and implement its `validate` method signature in `TaskGraphValidator` class.

---

## Phase 2: Foundational (Core Validation Logic)

**Purpose**: Implement the primary mechanisms for detecting graph inconsistencies.

**⚠️ CRITICAL**: All tasks in this phase contribute directly to the core validation and must be completed before integration.

### Tests for User Story 1 - Validate Graph Before Execution (P1) 🎯 MVP

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T006 [P] [US1] Write unit tests for duplicate task detection in `tests/TaskGraphValidator.test.ts`
- [ ] T007 [P] [US1] Write unit tests for missing dependency detection in `tests/TaskGraphValidator.test.ts`
- [ ] T008 [P] [US1] Write unit tests for cycle detection (DFS-based) in `tests/TaskGraphValidator.test.ts`
- [ ] T009 [P] [US1] Write unit tests for valid graph scenario, ensuring no errors are returned in `tests/TaskGraphValidator.test.ts`
- [ ] T010 [US1] Write an integration test that calls `TaskRunner.run` with an invalid graph (cycle) and expects an error in `tests/TaskRunner.test.ts`
- [ ] T011 [US1] Write an integration test that calls `TaskRunner.run` with an invalid graph (missing dependency) and expects an error in `tests/TaskRunner.test.ts`
- [ ] T012 [US1] Write an integration test that calls `TaskRunner.run` with an invalid graph (duplicate task) and expects an error in `tests/TaskRunner.test.ts`
- [ ] T013 [US1] Write an integration test that calls `TaskRunner.run` with a valid graph and expects successful execution in `tests/TaskRunner.test.ts`

### Implementation for User Story 1 - Validate Graph Before Execution (P1)

- [ ] T014 [US1] Implement duplicate task detection logic within `TaskGraphValidator.validate` in `src/TaskGraphValidator.ts`
- [ ] T015 [US1] Implement a helper to build an adjacency list/map for efficient graph traversal in `src/TaskGraphValidator.ts`
- [ ] T016 [US1] Implement missing dependency detection logic within `TaskGraphValidator.validate` in `src/TaskGraphValidator.ts`
- [ ] T017 [US1] Implement DFS-based cycle detection logic within `TaskGraphValidator.validate` in `src/TaskGraphValidator.ts`
- [ ] T018 [US1] Refine error message generation to be clear and informative (FR-006) in `src/TaskGraphValidator.ts`
- [ ] T019 [US1] Integrate `ITaskGraphValidator` into `TaskRunner` to perform pre-execution validation before running tasks, handling `ValidationResult` and throwing an error if `isValid` is false in `src/TaskRunner.ts`

**Checkpoint**: At this point, the `TaskGraphValidator` should be fully functional, tested, and integrated into `TaskRunner`.

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Ensure robust error reporting, performance, and adherence to coding standards.

- [ ] T020 Code cleanup and refactoring for `TaskGraphValidator.ts` and `TaskRunner.ts`
- [ ] T021 Add JSDoc comments to public methods/interfaces in `src/TaskGraphValidator.ts` and `src/TaskRunner.ts` where validation is integrated.
- [ ] T022 Ensure performance goals (SC-001) are met for large graphs (performance testing if dedicated framework is available, otherwise manual verification with test data) in `tests/TaskGraphValidator.test.ts` (e.g. create large test graphs)
- [ ] T023 Run `quickstart.md` examples as final validation step.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion
- **Polish (Final Phase)**: Depends on Foundational phase completion

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Setup (Phase 1).

### Within Each User Story

- Tests MUST be written and FAIL before implementation.
- Helper functions before main logic.
- Core validation logic before integration.

### Parallel Opportunities

- Tasks T003, T004, T006, T007, T008, T009 can be done in parallel.
- Integration tests (T010-T013) can be done in parallel (after unit tests).
- Final phase tasks T020, T021, T022 can have some parallel execution.

---

## Parallel Example: User Story 1

```bash
# Launch all unit tests for User Story 1 together:
- [ ] T006 [P] [US1] Write unit tests for duplicate task detection in `tests/TaskGraphValidator.test.ts`
- [ ] T007 [P] [US1] Write unit tests for missing dependency detection in `tests/TaskGraphValidator.test.ts`
- [ ] T008 [P] [US1] Write unit tests for cycle detection (DFS-based) in `tests/TaskGraphValidator.test.ts`
- [ ] T009 [P] [US1] Write unit tests for valid graph scenario, ensuring no errors are returned in `tests/TaskGraphValidator.test.ts`

# Implementation of core validation logic (can be sequential or parallel if components are isolated):
- [ ] T014 [US1] Implement duplicate task detection logic within `TaskGraphValidator.validate` in `src/TaskGraphValidator.ts`
- [ ] T015 [US1] Implement a helper to build an adjacency list/map for efficient graph traversal in `src/TaskGraphValidator.ts`
- [ ] T016 [US1] Implement missing dependency detection logic within `TaskGraphValidator.validate` in `src/TaskGraphValidator.ts`
- [ ] T017 [US1] Implement DFS-based cycle detection logic within `TaskGraphValidator.validate` in `src/TaskGraphValidator.ts`
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. **STOP and VALIDATE**: Test User Story 1 independently
4. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup together.
2. Once Setup is done, different developers can work on unit tests (T006-T009) in parallel and then implementation tasks (T014-T018) in parallel for different validation aspects.
3. Integration task (T019) would be a final step for one developer.

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
