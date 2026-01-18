import { TaskStep } from "../TaskStep.js";
import { TaskResult } from "../TaskResult.js";

/**
 * Interface for task execution strategies.
 * Allows different execution behaviors (e.g., standard, dry-run, debugging).
 */
export interface IExecutionStrategy<TContext> {
  /**
   * Executes a single task step.
   * @param step The task step to execute.
   * @param context The shared context.
   * @param signal Optional abort signal.
   * @returns A promise resolving to the task result.
   */
  execute(
    step: TaskStep<TContext>,
    context: TContext,
    signal?: AbortSignal
  ): Promise<TaskResult>;
}
