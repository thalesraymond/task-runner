import { TaskResult } from "./TaskResult.js";
import { TaskRetryConfig } from "./contracts/TaskRetryConfig.js";
import { TaskLoopConfig } from "./contracts/TaskLoopConfig.js";

/**
 * Condition determining when a dependent task should be executed.
 */
export type TaskRunCondition = "success" | "always";

/**
 * Configuration for a task dependency.
 */
export interface TaskDependencyConfig {
  /** The name of the task to depend on. */
  step: string;
  /**
   * When this task should run relative to the dependency.
   * - "success" (default): Runs only if the dependency completes successfully.
   * - "always": Runs if the dependency completes successfully or fails (but NOT if it is skipped).
   */
  runCondition?: TaskRunCondition;
}

/**
 * Represents a single, executable step within a workflow.
 * @template TContext The shape of the shared context object.
 */
export interface TaskStep<TContext> {
  /** A unique identifier for this task. */
  name: string;
  /** An optional list of task dependencies before this step can run. */
  dependencies?: (string | TaskDependencyConfig)[];
  /** Optional retry configuration for the task. */
  retry?: TaskRetryConfig;
  /** Optional loop configuration for the task. */
  loop?: TaskLoopConfig<TContext>;
  /**
   * Optional function to determine if the task should run.
   * If it returns false (synchronously or asynchronously), the task is skipped.
   */
  condition?: (context: TContext) => boolean | Promise<boolean>;

  /**
   * Optional priority.
   * Higher values are picked first. Default is 0.
   * Only affects ordering when multiple tasks are ready and concurrency slots are limited.
   */
  priority?: number;

  /**
   * Optional flag to indicate that the workflow should continue even if this task fails.
   * If true, dependent tasks will execute as if this task succeeded.
   * The task result will still be marked as "failure".
   * Default is false.
   */
  continueOnError?: boolean;

  /**
   * Optional maximum execution time in milliseconds.
   * If the task runs longer than this, it will be cancelled and marked as failed.
   */
  timeout?: number;

  /**
   * The core logic of the task.
   * @param context The shared context object, allowing for state to be passed between tasks.
   * @param signal An optional AbortSignal to listen for cancellation.
   * @returns A Promise that resolves to a TaskResult.
   */
  run(context: TContext, signal?: AbortSignal): Promise<TaskResult>;
}
