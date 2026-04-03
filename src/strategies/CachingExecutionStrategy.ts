import { IExecutionStrategy } from "./IExecutionStrategy.js";
import { TaskStep } from "../TaskStep.js";
import { TaskResult } from "../TaskResult.js";
import { ICacheProvider } from "../contracts/ICacheProvider.js";

/**
 * An execution strategy that wraps another strategy to provide caching capabilities.
 * @template TContext The shape of the shared context object.
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

    if (cachedResult !== undefined) {
      if (step.cache.restore) {
        await step.cache.restore(context, cachedResult);
      }
      return {
        ...cachedResult,
        status: "skipped", // or "cached" if we add it to TaskStatus
      };
    }

    const result = await this.innerStrategy.execute(step, context, signal);

    if (result.status === "success") {
      await this.cacheProvider.set(cacheKey, result, step.cache.ttl);
    }

    return result;
  }
}
