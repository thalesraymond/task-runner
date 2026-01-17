/**
 * @file specs/003-refactor-file-structure/contracts/api.ts
 * @description
 *   This file defines the public API contract for the task-runner library.
 *   After the refactoring, the main `src/index.ts` file will export these
 *   specific entities, hiding all internal implementation details. This
 *   adheres to the Principle of Least Exposure.
 */

// Core class for running tasks
export { TaskRunner } from '../src/TaskRunner';

// Key interfaces and types for defining tasks and interpreting results
export type { TaskStep } from '../src/TaskStep';
export type { TaskResult } from '../src/TaskResult';
export type { TaskStatus } from '../src/TaskStatus';
