import { TaskResult } from "./TaskResult.js";

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
   * @param signal An optional AbortSignal to listen for cancellation.
   * @returns A Promise that resolves to a TaskResult.
   */
  run(context: TContext, signal?: AbortSignal): Promise<TaskResult>;
}
