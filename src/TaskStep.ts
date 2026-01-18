import { TaskResult } from "./TaskResult.js";

/**
 * Configuration for retrying a failed task.
 */
export interface TaskRetryConfig {
  /** The number of retry attempts allowed (excluding the initial run). */
  attempts: number;
  /** The delay in milliseconds between retry attempts. */
  delay?: number;
  /** The backoff strategy to use for delay calculation. Defaults to 'fixed'. */
  backoff?: "fixed" | "exponential";
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
  /** Optional retry configuration for the task. */
  retry?: TaskRetryConfig;
  /**
   * The core logic of the task.
   * @param context The shared context object, allowing for state to be passed between tasks.
   * @param signal An optional AbortSignal to listen for cancellation.
   * @returns A Promise that resolves to a TaskResult.
   */
  run(context: TContext, signal?: AbortSignal): Promise<TaskResult>;
}
