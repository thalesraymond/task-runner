import { IExecutionStrategy } from "./IExecutionStrategy.js";
import { TaskStep } from "../TaskStep.js";
import { TaskResult } from "../TaskResult.js";

/**
 * Standard execution strategy that runs the task's run method.
 */
export class StandardExecutionStrategy<
  TContext,
> implements IExecutionStrategy<TContext> {
  async execute(
    step: TaskStep<TContext>,
    context: TContext,
    signal?: AbortSignal
  ): Promise<TaskResult> {
    try {
      return await step.run(context, signal);
    } catch (e) {
      // Check if error is due to abort
      if (
        signal?.aborted &&
        ((e instanceof Error && e.name === "AbortError") || signal.reason === e)
      ) {
        return {
          status: "cancelled",
          message: "Task cancelled during execution",
        };
      }
      return {
        status: "failure",
        error: e instanceof Error ? e.message : String(e),
      };
    }
  }
}
