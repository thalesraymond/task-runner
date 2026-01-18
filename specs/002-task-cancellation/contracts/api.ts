// src/contracts/api.ts

/**
 * Defines the status of a TaskStep's execution.
 * - 'pending': The task is waiting to be executed.
 * - 'in-progress': The task is currently running.
 * - 'success': The task completed without errors.
 * - 'failure': The task completed with an error.
 * - 'skipped': The task was skipped due to a failed dependency.
 * - 'cancelled': The task was cancelled before completion (e.g., due to AbortSignal or timeout).
 */
export type TaskStatus = 'pending' | 'in-progress' | 'success' | 'failure' | 'skipped' | 'cancelled';

/**
 * Represents the configuration and execution logic for a single unit of work.
 * @template TContext The type of the shared context object.
 * @template TResult The type of the data returned by the task's run method.
 */
export interface TaskStep<TContext extends Record<string, any> = Record<string, any>, TResult = any> {
  /** A unique identifier for the task step. */
  name: string;
  /** An optional list of names of other TaskSteps that must complete successfully before this task can begin. */
  dependencies?: string[];
  /**
   * The function that executes the core logic of the task step.
   * It receives the shared context object and an AbortSignal to observe cancellation.
   * @param context The shared context object.
   * @param signal An AbortSignal to observe cancellation requests.
   * @returns A Promise resolving to the task's result data, or void.
   */
  run: (context: TContext, signal: AbortSignal) => Promise<TResult | void>;
}

/**
 * Represents the outcome of a TaskStep's execution.
 * @template TResult The type of the data returned by the task's run method.
 */
export interface TaskStepResult<TResult = any> {
  /** The name of the task step that was executed. */
  taskName: string;
  /** The final status of the task step. */
  status: TaskStatus;
  /** A human-readable message providing more details about the outcome, if any. */
  message?: string;
  /** The error object if the task failed. */
  error?: Error;
  /** Any data returned by the run method of the TaskStep. */
  data?: TResult;
  /** The timestamp when the task started. */
  startTime?: number;
  /** The timestamp when the task completed. */
  endTime?: number;
}

/**
 * Configuration options for the TaskRunner's execution.
 */
export interface TaskRunnerConfig {
  /**
   * An AbortSignal that can be used to externally cancel the entire TaskRunner workflow.
   * When this signal is aborted, the TaskRunner will stop executing further tasks
   * and attempt to interrupt currently running ones.
   */
  signal?: AbortSignal;
  /**
   * A global timeout in milliseconds for the entire TaskRunner workflow.
   * If the workflow does not complete within this time, it will be automatically cancelled.
   */
  timeout?: number;
}

/**
 * The main orchestrator for managing and executing TaskSteps based on their dependencies.
 * @template TContext The type of the shared context object for all tasks.
 */
export interface TaskRunner<TContext extends Record<string, any> = Record<string, any>> {
  /**
   * Registers a new TaskStep with the runner.
   * @param task The TaskStep to register.
   */
  addTask(task: TaskStep<TContext>): void;

  /**
   * Executes all registered tasks according to their dependencies.
   * Accepts an optional configuration object to control cancellation and timeout.
   * @param initialContext An optional initial context object to be shared across tasks.
   * @param config Optional configuration for the TaskRunner's execution.
   * @returns A Promise that resolves with an array of TaskStepResults once all tasks have completed.
   */
  runAll(initialContext?: TContext, config?: TaskRunnerConfig): Promise<TaskStepResult[]>;

  /**
   * A generic shared context object for tasks.
   * @template TContext The type of the context.
   */
  context: TContext;
}
