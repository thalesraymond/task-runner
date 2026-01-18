# Project: Task Runner

## Overview

The 'task-runner' project is a TypeScript-based utility designed to manage and execute tasks. It incorporates features such as task cancellation, pre-execution validation, and concurrency control, providing a robust framework for workflow automation.

## Tech Stack

- **Languages:** TypeScript 5.9.3
- **Testing:** Vitest 4.0.17
- **Core APIs:** AbortSignal/AbortController (Standard Web APIs for cancellation)
- **Package Manager:** pnpm

## Architecture

The project follows a modular architecture with distinct components for managing different aspects of task execution:

- `EventBus.ts`: Handles event propagation within the system.
- `TaskGraph.ts`: Represents the structure and dependencies of tasks.
- `TaskGraphValidator.ts`: Ensures the validity of task graphs before execution.
- `TaskRunner.ts`: Orchestrates the execution of tasks.
- `WorkflowExecutor.ts`: Manages the overall workflow.
- `contracts/`: Defines interfaces and types for various components, promoting loose coupling and clear API boundaries.

## Conventions

- **Coding Style:** Adheres to standard TypeScript conventions, enforced by ESLint and Prettier.
- **Commit Messages:** Follows conventional commits enforced by Commitlint.
- **Git Hooks:** Utilizes Husky for pre-commit and commit-msg hooks.
- **Testing:** Uses Vitest for unit and integration testing.
- **Atomic Commits:** When working on complex multi-task features, commit after each distinct task, ensuring build, lint, and test success to establish safe rollback points.

## Build/Test/Run Commands

- **Install Dependencies:** `pnpm install`
- **Build Project:** `pnpm build`
- **Run Tests:** `pnpm test`
- **Lint Code:** `pnpm lint`
