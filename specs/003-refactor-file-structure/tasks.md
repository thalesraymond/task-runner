# Tasks: Refactor File Structure

**Input**: Design documents from `/specs/003-refactor-file-structure/`
**Prerequisites**: plan.md (required), spec.md (required for user stories)

**Organization**: Tasks are grouped by entity to be refactored. This aligns with the user stories, which are both P1 and cover the same goal.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel
- **[Story]**: [US1] for User Story 1 (Improved Code Navigation) and [US2] for User Story 2 (Colocated Tests). Since they are intertwined, tasks will be marked with both.

## Phase 1: Setup (File Creation)

**Purpose**: Create all the new empty files for the refactored structure.

- [x] T001 [P] Create empty file `src/TaskStatus.ts`
- [x] T002 [P] Create empty file `src/TaskResult.ts`
- [x] T003 [P] Create empty file `src/TaskStep.ts`
- [x] T004 [P] Create empty file `src/TaskRunner.ts`
- [x] T005 [P] Create empty file `tests/TaskStatus.test.ts`
- [x] T006 [P] Create empty file `tests/TaskResult.test.ts`
- [x] T007 [P] Create empty file `tests/TaskStep.test.ts`
- [x] T008 [P] Create empty file `tests/TaskRunner.test.ts`

---

## Phase 2: Refactor Entities (User Stories 1 & 2)

**Purpose**: Move code and tests from the monolithic files to their new dedicated files, one entity at a time.

### TaskStatus

- [x] T009 [US1] Move `TaskStatus` type from `src/index.ts` to `src/TaskStatus.ts`

### TaskResult

- [x] T010 [US1] Move `TaskResult` interface from `src/index.ts` to `src/TaskResult.ts`

### TaskStep

- [x] T011 [US1] Move `TaskStep` interface from `src/index.ts` to `src/TaskStep.ts`

### TaskRunner

- [x] T012 [US1] Move `TaskRunner` class from `src/index.ts` to `src/TaskRunner.ts`
- [x] T013 [US1] Update imports within `src/TaskRunner.ts` to reflect the new file locations for `TaskStatus`, `TaskResult`, and `TaskStep`.
- [x] T014 [US2] Move tests for `TaskRunner` from `tests/index.test.ts` to `tests/TaskRunner.test.ts`.
- [x] T015 [US2] Update imports within `tests/TaskRunner.test.ts` for `TaskRunner` and other types.
- [x] T016 [US2] Run the tests in `tests/TaskRunner.test.ts` to ensure they pass after the move.

---

## Phase 3: Polish & Finalization

**Purpose**: Clean up the old files and verify the entire project is working correctly.

- [x] T017 [US1] Update `src/index.ts` to be a barrel file, exporting all public entities from their new files.
- [x] T018 [US2] Delete the now-empty `tests/index.test.ts` file.
- [x] T019 Run all project tests via `npm test` to ensure 100% pass rate.
- [x] T020 Run the linter via `npm run lint` and fix any issues.
- [x] T021 Run the formatter via `npm run format` to ensure consistent style.

---

## Dependencies & Execution Order

- **Phase 1 (Setup)** can run entirely in parallel.
- **Phase 2 (Refactor)** should be done sequentially, entity by entity, to isolate any issues. The order presented is recommended (simplest to most complex).
- **Phase 3 (Polish)** depends on the completion of Phase 2.

### Parallel Opportunities

- All tasks in Phase 1 can be run in parallel.
- The refactoring of each entity in Phase 2 is largely independent, but doing them sequentially is safer for a refactoring task.

---

## Implementation Strategy

This is a pure refactoring task. The strategy is to move code and tests piece by piece, running tests at each step to ensure no functionality is broken.

1.  **Create all files**: Complete Phase 1.
2.  **Move Entity by Entity**: Complete Phase 2, running tests for `TaskRunner` after it is moved.
3.  **Finalize**: Complete Phase 3 to clean up and verify the entire project.
