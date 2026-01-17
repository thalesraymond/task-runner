# Implementation Plan: Generic Task Runner

## 1. Technical Context

- **Project:** `task-runner`
- **Language:** TypeScript
- **Package Manager:** pnpm
- **Testing Framework:** vitest
- **Core Objective:** Create a generic, dependency-aware, parallel task execution engine as a standalone library.
- **Key Technologies:** This is a pure TypeScript library with no runtime dependencies. Development dependencies include `vitest` for testing.

## 2. Constitution Check

The project constitution (`.specify/memory/constitution.md`) is currently a template and has not been filled out. Therefore, no specific project principles could be formally checked. The plan will proceed following standard best practices for library development, including high test coverage and clear API contracts.

## 3. Proposed Architecture

The architecture will be simple and self-contained within the `src/` directory, suitable for a lightweight, dependency-free npm package.

- **`src/index.ts`**: This will be the main entry point of the library. It will export all the public-facing types and the main `TaskRunner` class.
  - **`TaskStatus` enum**: Defines `'success' | 'failure' | 'skipped'`.
  - **`TaskResult` interface**: Defines the result object for a single task.
  - **`TaskStep<TContext>` interface**: Defines the structure of a single task, including its `name`, `dependencies`, and `run` method.
  - **`TaskRunner<TContext>` class**: The core engine that manages task execution. It will contain the logic for dependency resolution, parallel execution, and status tracking.

- **`tests/index.test.ts`**: This file will contain a comprehensive suite of unit and integration tests for the `TaskRunner`. Tests will cover:
  - Basic sequential execution.
  - Correct parallel execution of independent tasks.
  - Failure and skipping of dependent tasks.
  - Circular dependency detection.
  - Edge cases (e.g., empty task list).

This single-file architecture is sufficient for the initial implementation. If the complexity grows, it can be refactored into multiple files within the `src` directory.

## 4. Data Model

The data model is detailed in the `data-model.md` artifact. It defines the core entities: `TaskStep`, `TaskResult`, `TaskRunner`, and the generic `Context`.

## 5. Contracts / Public API

The public API contract is defined by the exported TypeScript types and classes in `contracts/api.ts`. This file serves as the source of truth for the library's public interface.

## 6. Implementation Phases

### Phase 1: Core Types and Sequential Execution

1.  **Define Core Types**: Implement the `TaskStatus`, `TaskResult`, and `TaskStep` interfaces in `src/index.ts`.
2.  **Implement Basic Runner**: Create the `TaskRunner` class with a simple, sequential execution loop (based on the first implementation described in the feature spec). This version will not yet support parallel execution.
3.  **Write Initial Tests**: Add tests for the sequential execution, ensuring dependencies are respected.

### Phase 2: Parallel Execution and Error Handling

1.  **Refactor for Parallelism**: Modify the `TaskRunner` to identify and execute eligible steps in parallel using `Promise.all()`, as described in the "State-of-the-Art" section of the feature spec.
2.  **Implement State Tracking**: Add the `running` set to prevent duplicate executions and help with deadlock detection.
3.  **Implement Skipping Logic**: Add the logic to identify and mark tasks as 'skipped' if their dependencies fail.
4.  **Add Advanced Tests**: Write tests specifically for parallel execution, task skipping, and failure modes.

### Phase 3: Deadlock Detection and Finalization

1.  **Implement Deadlock Detection**: Add the check to ensure the runner throws an error if no tasks are eligible to run but the work is not complete.
2.  **Write Deadlock Tests**: Create a test case with a circular dependency to verify the error is thrown.
3.  **Documentation**: Add TSDoc comments to all public-facing types and methods.
4.  **Review and Refactor**: Clean up the code and ensure it meets quality standards.
