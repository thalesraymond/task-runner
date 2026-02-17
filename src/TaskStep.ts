import { TaskResult } from "./TaskResult.js";
import { TaskRetryConfig } from "./contracts/TaskRetryConfig.js";

/**
 * Represents a single, executable step within a workflow.
 * @template TContext The shape of the shared context object.
 */
export interface TaskStep<TContext> {
  /** A unique identifier for this task. */
  name: string;
  /** An optional list of task names that must complete successfully before this step can run. */
  dependencies?: string[];
  /** Optional retry configuration for the task. */
  retry?: TaskRetryConfig;
  /**
   * Optional function to determine if the task should run.
   * If it returns false (synchronously or asynchronously), the task is skipped.
   */
  condition?: (context: TContext) => boolean | Promise<boolean>;

  /**
   * Optional flag to indicate if execution should continue even if this task fails.
   * If true, dependent tasks will still be executed as if this task succeeded.
   * The task status will still be "failure".
   * Default is false.
   */
  continueOnError?: boolean;

  /**
   * Optional priority.
   * Higher values are picked first. Default is 0.
   * Only affects ordering when multiple tasks are ready and concurrency slots are limited.
   */
  priority?: number;

  /**
   * The core logic of the task.
   * @param context The shared context object, allowing for state to be passed between tasks.
   * @param signal An optional AbortSignal to listen for cancellation.
   * @returns A Promise that resolves to a TaskResult.
   */
  run(context: TContext, signal?: AbortSignal): Promise<TaskResult>;
}
