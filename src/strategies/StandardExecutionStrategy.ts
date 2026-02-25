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
    const timeoutSignal = abortController.signal;

    // If parent signal exists, listen to it
    const handleParentAbort = () => {
      abortController.abort(signal?.reason);
    };

    if (signal) {
      if (signal.aborted) {
        abortController.abort(signal.reason);
      } else {
        signal.addEventListener("abort", handleParentAbort);
      }
    }

    let timer: NodeJS.Timeout | undefined;

    try {
      const timeoutPromise = new Promise<TaskResult>((resolve) => {
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
      // timer is always assigned in the synchronous Promise executor
      clearTimeout(timer);

      if (signal) {
        signal.removeEventListener("abort", handleParentAbort);
      }
    }
  }
}
