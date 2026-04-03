import { IExecutionStrategy } from "./IExecutionStrategy.js";
import { TaskStep } from "../TaskStep.js";
import { TaskResult } from "../TaskResult.js";
import { ICacheProvider } from "../contracts/ICacheProvider.js";

/**
 * Execution strategy that wraps another strategy and adds caching capabilities.
 */
export class CachingExecutionStrategy<TContext> implements IExecutionStrategy<TContext> {
  constructor(
    private readonly innerStrategy: IExecutionStrategy<TContext>,
    private readonly cacheProvider: ICacheProvider
  ) {}

  async execute(
    step: TaskStep<TContext>,
    context: TContext,
    signal?: AbortSignal
  ): Promise<TaskResult> {
    if (!step.cache) {
      return this.innerStrategy.execute(step, context, signal);
    }

    const cacheKey = await step.cache.key(context);
    const cachedResult = await this.cacheProvider.get(cacheKey);

    if (cachedResult) {
      if (step.cache.restore) {
        await step.cache.restore(context, cachedResult);
      }

      return {
        ...cachedResult,
        status: "skipped",
        message: cachedResult.message ? `${cachedResult.message} (cached)` : "Task skipped (cached)",
      };
    }

    const result = await this.innerStrategy.execute(step, context, signal);

    if (result.status === "success") {
      await this.cacheProvider.set(cacheKey, result, step.cache.ttl);
    }

    return result;
  }
}
