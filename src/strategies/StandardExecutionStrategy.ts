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
    if (!step.timeout) {
      try {
        return await step.run(context, signal);
      } catch (e) {
        // Check if error is due to abort
        if (
          signal?.aborted &&
          ((e instanceof Error && e.name === "AbortError") ||
            signal.reason === e)
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

    const abortController = new AbortController();
    const timeoutSignal = signal
      ? AbortSignal.any([signal, abortController.signal])
      : abortController.signal;

    let timer: NodeJS.Timeout | undefined;
    let resolveTimeout!: (value: TaskResult) => void;

    try {
      const timeoutPromise = new Promise<TaskResult>((resolve) => {
        resolveTimeout = resolve;
        timer = setTimeout(() => {
          abortController.abort(new Error("Timeout"));
          resolve({
            status: "failure",
            error: `Task timed out after ${step.timeout}ms`,
          });
        }, step.timeout);
      });

      const taskPromise = step.run(context, timeoutSignal);

      return await Promise.race([taskPromise, timeoutPromise]);
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
    } finally {
      clearTimeout(timer);
      // Settle the timeout promise to avoid memory leaks from Promise.race
      resolveTimeout({ status: "cancelled" } as TaskResult);
    }
  }
}
