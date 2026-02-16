import { IExecutionStrategy } from "./IExecutionStrategy.js";
import { TaskStep } from "../TaskStep.js";
import { TaskResult } from "../TaskResult.js";

/**
 * Execution strategy that retries tasks upon failure based on their retry configuration.
 */
export class RetryingExecutionStrategy<
  TContext,
> implements IExecutionStrategy<TContext> {
  constructor(private innerStrategy: IExecutionStrategy<TContext>) {}

  async execute(
    step: TaskStep<TContext>,
    context: TContext,
    signal?: AbortSignal
  ): Promise<TaskResult> {
    const config = step.retry;
    if (!config) {
      return this.innerStrategy.execute(step, context, signal);
    }

    let attempt = 0;
    while (true) {
      // Check for cancellation before execution
      if (signal?.aborted) {
        return {
          status: "cancelled",
          message: "Task cancelled before execution",
        };
      }

      const result = await this.innerStrategy.execute(step, context, signal);

      if (
        result.status === "success" ||
        result.status === "cancelled" ||
        result.status === "skipped"
      ) {
        return result;
      }

      // Task failed, check if we should retry based on predicate
      if (config.shouldRetry && !config.shouldRetry(result.error)) {
        return result;
      }

      // Task failed, check if we should retry based on attempts
      if (attempt >= config.attempts) {
        return result; // Max attempts reached, return failure
      }

      attempt++;

      // Calculate delay
      let delay = config.delay;
      if (config.backoff === "exponential") {
        delay = config.delay * Math.pow(2, attempt - 1);
      }

      // Wait for delay, respecting cancellation
      try {
        await this.sleep(delay, signal);
      } catch (e) {
        if (signal?.aborted) {
          return {
            status: "cancelled",
            message: "Task cancelled during retry delay",
          };
        }
        throw e;
      }
    }
  }

  private sleep(ms: number, signal?: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      if (signal?.aborted) {
        reject(new Error("AbortError"));
        return;
      }

      const timer = setTimeout(() => {
        cleanup();
        resolve();
      }, ms);

      const onAbort = () => {
        clearTimeout(timer);
        cleanup();
        reject(new Error("AbortError"));
      };

      const cleanup = () => {
        signal?.removeEventListener("abort", onAbort);
      };

      signal?.addEventListener("abort", onAbort);
    });
  }
}
