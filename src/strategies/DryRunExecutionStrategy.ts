import { IExecutionStrategy } from "./IExecutionStrategy.js";
import { TaskStep } from "../TaskStep.js";
import { TaskResult } from "../TaskResult.js";

/**
 * Execution strategy that simulates task execution without running the actual logic.
 */
export class DryRunExecutionStrategy<
  TContext,
> implements IExecutionStrategy<TContext> {
  /**
   * Simulates execution by returning a success result immediately.
   * @param step The task step (ignored).
   * @param context The shared context (ignored).
   * @param signal Optional abort signal (ignored).
   * @returns A promise resolving to a success result.
   */
  async execute(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _step: TaskStep<TContext>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _context: TContext,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _signal?: AbortSignal
  ): Promise<TaskResult> {
    return Promise.resolve({
      status: "success",
      message: "Dry run: simulated success",
    });
  }
}
