/**
 * @file This file defines the public API contract for the Generic Task Runner library.
 * These are the types and classes that will be exported for consumers of the library.
 */

/**
 * Represents the completion status of a task.
 */
export type TaskStatus = "success" | "failure" | "skipped";

/**
 * Defines the result object returned by a single task step.
 */
export interface TaskResult {
  /** The final status of the task. */
  status: TaskStatus;
  /** An optional message, typically used for success statuses. */
  message?: string;
  /** An optional error message, typically used for failure statuses. */
  error?: string;
  /** Optional data produced by the step for later inspection. */
  data?: unknown;
}

/**
 * Represents a single, executable step within a workflow.
 * @template TContext The shape of the shared context object.
 */
export interface TaskStep<TContext> {
  /** A unique identifier for this task. */
  name: string;
  /** An optional list of task names that must complete successfully before this step can run. */
  dependencies?: string[];
  /**
   * The core logic of the task.
   * @param context The shared context object, allowing for state to be passed between tasks.
   * @returns A Promise that resolves to a TaskResult.
   */
  run(context: TContext): Promise<TaskResult>;
}

/**
 * The main class that orchestrates the execution of a list of tasks
 * based on their dependencies, with support for parallel execution.
 * @template TContext The shape of the shared context object.
 */
export class TaskRunner<TContext> {
  /**
   * @param context The shared context object to be passed to each task.
   */
  constructor(private context: TContext) {}

  /**
   * Executes a list of tasks, respecting their dependencies and running
   * independent tasks in parallel.
   * @param steps An array of TaskStep objects to be executed.
   * @returns A Promise that resolves to a Map where keys are task names
   * and values are the corresponding TaskResult objects.
   */
  async execute(steps: TaskStep<TContext>[]): Promise<Map<string, TaskResult>> {
    // Implementation will be in src/index.ts
    return new Map();
  }
}
