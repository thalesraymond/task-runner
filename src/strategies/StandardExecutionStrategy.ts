import { IExecutionStrategy } from "./IExecutionStrategy.js";
import { TaskStep } from "../TaskStep.js";
import { TaskResult } from "../TaskResult.js";

/**
 * Standard execution strategy that runs the task's run method,
 * with support for retry logic.
 */
export class StandardExecutionStrategy<TContext>
  implements IExecutionStrategy<TContext>
{
  async execute(
    step: TaskStep<TContext>,
    context: TContext,
    signal?: AbortSignal
  ): Promise<TaskResult> {
    const retryConfig = step.retry;
    let attempts = retryConfig ? retryConfig.attempts : 0;

    // Loop at least once (initial run), then retry if needed
    // Loop condition: we run initially, then retry if we have attempts left
    // We can just loop `attempts + 1` times.
    const maxRuns = attempts + 1;

    for (let i = 0; i < maxRuns; i++) {
      // If aborted, stop immediately
      if (signal?.aborted) {
        return {
          status: "cancelled",
          message: "Task cancelled before execution attempt",
        };
      }

      // Check for delay if this is a retry (i > 0)
      if (i > 0 && retryConfig) {
        const delay = this.calculateDelay(retryConfig.delay, retryConfig.backoff, i);
        try {
          await this.sleep(delay, signal);
        } catch (e) {
             // If sleep was aborted
            if (signal?.aborted) {
                return {
                    status: "cancelled",
                    message: "Task cancelled during retry delay",
                };
            }
            // Should not happen really if sleep only throws on abort
        }
      }

       // Double check abort after sleep
       /* v8 ignore start */
       if (signal?.aborted) {
        return {
          status: "cancelled",
          message: "Task cancelled after retry delay",
        };
      }
      /* v8 ignore stop */

      try {
        const result = await step.run(context, signal);

        // If success, return immediately
        if (result.status === "success" || result.status === "skipped") {
            return result;
        }

        // If cancelled, return immediately (no retry on cancellation)
        if (result.status === "cancelled") {
            return result;
        }

        // If failure, check if we have retries left
        // If we are at the last iteration, return the failure
        if (i === maxRuns - 1) {
            return result;
        }

        // Otherwise, continue to next iteration (retry)

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

        // If it's a regular error and we are at the last iteration, return failure
        if (i === maxRuns - 1) {
             return {
                status: "failure",
                error: e instanceof Error ? e.message : String(e),
            };
        }
        // Otherwise continue to next iteration
      }
    }

    // Should not accept here, but typescript wants a return
    /* v8 ignore start */
    return {
        status: "failure",
        error: "Task failed after maximum retries (unexpected code path)",
    };
    /* v8 ignore stop */
  }

  private calculateDelay(baseDelay: number = 0, backoff: 'fixed' | 'exponential' = 'fixed', attempt: number): number {
    if (backoff === 'exponential') {
        // attempt is 1 for the first retry, 2 for the second, etc.
        // We want delay * 2^(attempt-1) maybe? Or just delay * 2^attempt?
        // Let's say delay=100.
        // Retry 1: 100 * 2^0 = 100? or 100 * 2^1 = 200?
        // Usually backoff starts at baseDelay.
        // Let's use simple: baseDelay * (2 ^ (attempt - 1))
        // attempt 1 (first retry): base * 1
        // attempt 2: base * 2
        // attempt 3: base * 4
        return baseDelay * Math.pow(2, attempt - 1);
    }
    return baseDelay;
  }

  private sleep(ms: number, signal?: AbortSignal): Promise<void> {
    if (ms <= 0) return Promise.resolve();
    return new Promise((resolve, reject) => {
        /* v8 ignore start */
        if (signal?.aborted) {
            reject(new Error("AbortError"));
            return;
        }
        /* v8 ignore stop */

        const timer = setTimeout(() => {
             resolve();
             signal?.removeEventListener("abort", onAbort);
        }, ms);

        const onAbort = () => {
            clearTimeout(timer);
            reject(new Error("AbortError"));
        };

        signal?.addEventListener("abort", onAbort, { once: true });
    });
  }
}
