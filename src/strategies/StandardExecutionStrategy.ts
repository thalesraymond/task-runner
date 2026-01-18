import { IExecutionStrategy } from "./IExecutionStrategy.js";
import { TaskStep } from "../TaskStep.js";
import { TaskResult } from "../TaskResult.js";

/**
 * Standard execution strategy that runs the task's run method, with support for retries.
 */
export class StandardExecutionStrategy<TContext>
  implements IExecutionStrategy<TContext>
{
  async execute(
    step: TaskStep<TContext>,
    context: TContext,
    signal?: AbortSignal
  ): Promise<TaskResult> {
    const maxRetries = step.retry?.attempts ?? 0;
    const initialDelay = step.retry?.delay ?? 0;
    const backoff = step.retry?.backoff ?? "fixed";

    let attempt = 0;

    // Loop until we succeed or exhaust retries
    // We run at least once (attempt 0), plus up to maxRetries
    while (true) {
      if (signal?.aborted) {
        return {
          status: "cancelled",
          message: "Task cancelled before execution attempt",
        };
      }

      // If this is a retry (attempt > 0), wait before running
      if (attempt > 0 && initialDelay > 0) {
        let waitTime = initialDelay;
        if (backoff === "exponential") {
          // exponential: delay * 2^(retry_count - 1)
          // retry_count is attempt.
          // attempt starts at 1 for the first retry.
          // 1st retry (attempt=1): delay * 2^0 = delay
          // 2nd retry (attempt=2): delay * 2^1 = 2*delay
          waitTime = initialDelay * Math.pow(2, attempt - 1);
        }

        try {
            await this.sleep(waitTime, signal);
        } catch {
             // If sleep throws (likely abort), return cancelled
             return {
                 status: "cancelled",
                 message: "Task cancelled during retry delay",
             };
        }
      }

      try {
        const result = await step.run(context, signal);

        // If success or other non-failure status, return immediately
        if (result.status !== "failure") {
          return result;
        }

        // If failure, check if we have retries left
        if (attempt >= maxRetries) {
          return result;
        }

        // Prepare for next attempt
        attempt++;

      } catch (e) {
        // Check if error is due to abort
        if (
          signal?.aborted &&
          (e instanceof Error && e.name === "AbortError" || signal.reason === e)
        ) {
          return {
            status: "cancelled",
            message: "Task cancelled during execution",
          };
        }

        // If generic error, treat as failure.
        // Check retries
        if (attempt >= maxRetries) {
           return {
            status: "failure",
            error: e instanceof Error ? e.message : String(e),
          };
        }

        // Prepare for next attempt
        attempt++;
      }
    }
  }

  private sleep(ms: number, signal?: AbortSignal): Promise<void> {
      return new Promise((resolve, reject) => {
          /* v8 ignore start */
          if (signal?.aborted) {
              return reject(new Error("AbortError"));
          }
          /* v8 ignore stop */

          const onAbort = () => {
              clearTimeout(timer);
              reject(new Error("AbortError"));
          };

          const timer = setTimeout(() => {
              signal?.removeEventListener("abort", onAbort);
              resolve();
          }, ms);

          signal?.addEventListener("abort", onAbort);
      });
  }
}
