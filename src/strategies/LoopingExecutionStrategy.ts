import { IExecutionStrategy } from "./IExecutionStrategy.js";
import { TaskStep } from "../TaskStep.js";
import { TaskResult } from "../TaskResult.js";

/**
 * Execution strategy that conditionally loops a task until a predicate is met.
 * It wraps another execution strategy (e.g., RetryingExecutionStrategy or StandardExecutionStrategy).
 */
export class LoopingExecutionStrategy<TContext> implements IExecutionStrategy<TContext> {
  constructor(private innerStrategy: IExecutionStrategy<TContext>) {}

  async execute(
    step: TaskStep<TContext>,
    context: TContext,
    signal?: AbortSignal
  ): Promise<TaskResult> {
    const config = step.loop;
    if (!config) {
      return this.innerStrategy.execute(step, context, signal);
    }

    const maxIterations = config.maxIterations ?? 1;
    const interval = config.interval ?? 0;
    let iteration = 0;

    while (true) {
      if (signal?.aborted) {
        return {
          status: "cancelled",
          message: "Task cancelled before loop iteration",
        };
      }

      // Execute the task
      const result = await this.innerStrategy.execute(step, context, signal);

      // Check if the condition is met
      if (config.until(context, result)) {
        return result;
      }

      iteration++;

      if (iteration >= maxIterations) {
        return {
          status: "failure",
          error: `Task '${step.name}' reached maximum loop iterations (${maxIterations}) without meeting condition.`,
        };
      }

      // Wait for interval
      try {
        await this.sleep(interval, signal);
      } catch (e) {
        if (signal?.aborted) {
          return {
            status: "cancelled",
            message: "Task cancelled during loop delay",
          };
        }
        throw e;
      }
    }
  }

  private sleep(ms: number, signal?: AbortSignal): Promise<void> {
    if (ms <= 0) {
      return Promise.resolve();
    }

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
