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
        return this.handleError(e, signal);
      }
    }

    return this.executeWithTimeout(step, context, signal);
  }

  private async executeWithTimeout(
    step: TaskStep<TContext>,
    context: TContext,
    signal?: AbortSignal
  ): Promise<TaskResult> {
    const abortController = new AbortController();
    const timeoutSignal = signal
      ? AbortSignal.any([signal, abortController.signal])
      : abortController.signal;

    const timeoutPromiseAbortController = new AbortController();
    let timer: NodeJS.Timeout | undefined;

    try {
      const timeoutPromise = new Promise<TaskResult>((resolve) => {
        timer = setTimeout(() => {
          abortController.abort(new Error("Timeout"));
          resolve({
            status: "failure",
            error: `Task timed out after ${step.timeout}ms`,
          });
        }, step.timeout!);

        timeoutPromiseAbortController.signal.addEventListener(
          "abort",
          () => resolve({ status: "cancelled" } as TaskResult),
          { once: true }
        );
      });

      const taskPromise = step.run(context, timeoutSignal);

      return await Promise.race([taskPromise, timeoutPromise]);
    } catch (e) {
      return this.handleError(e, signal);
    } finally {
      clearTimeout(timer);
      // Settle the timeout promise to avoid memory leaks from Promise.race
      timeoutPromiseAbortController.abort();
    }
  }

  private handleError(e: unknown, signal?: AbortSignal): TaskResult {
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
