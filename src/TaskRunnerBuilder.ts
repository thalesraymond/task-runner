import { TaskRunner } from "./TaskRunner.js";
import {
  RunnerEventPayloads,
  RunnerEventListener,
} from "./contracts/RunnerEvents.js";
import { IExecutionStrategy } from "./strategies/IExecutionStrategy.js";
import { LoopingExecutionStrategy } from "./strategies/LoopingExecutionStrategy.js";
import { RetryingExecutionStrategy } from "./strategies/RetryingExecutionStrategy.js";
import { StandardExecutionStrategy } from "./strategies/StandardExecutionStrategy.js";
import { ICacheProvider } from "./contracts/ICacheProvider.js";

/**
 * A builder for configuring and creating TaskRunner instances.
 */
export class TaskRunnerBuilder<TContext> {
  private readonly context: TContext;
  private strategy?: IExecutionStrategy<TContext>;
  private listeners: {
    [K in keyof RunnerEventPayloads<TContext>]?: RunnerEventListener<
      TContext,
      K
    >[];
  } = {};
  private cacheProvider?: ICacheProvider;
  private useCaching: boolean = false;

  /**
   * @param context The shared context object.
   */
  constructor(context: TContext) {
    this.context = context;
  }

  /**
   * Enables task output caching.
   * @param provider The cache provider to use. Defaults to MemoryCacheProvider.
   * @returns The builder instance.
   */
  public withCache(provider?: ICacheProvider): this {
    this.useCaching = true;
    if (provider) {
      this.cacheProvider = provider;
    }
    return this;
  }

  /**
   * Sets the execution strategy.
   * @param strategy The execution strategy to use.
   * @returns The builder instance.
   */
  public useStrategy(strategy: IExecutionStrategy<TContext>): this {
    this.strategy = strategy;
    return this;
  }

  /**
   * Adds an event listener.
   * @param event The event name.
   * @param callback The callback to execute.
   * @returns The builder instance.
   */
  public on<K extends keyof RunnerEventPayloads<TContext>>(
    event: K,
    callback: RunnerEventListener<TContext, K>
  ): this {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]!.push(callback);
    return this;
  }

  /**
   * Builds the TaskRunner instance.
   * @returns A configured TaskRunner.
   */
  public build(): TaskRunner<TContext> {
    const runner = new TaskRunner(this.context);

    // Apply LoopingExecutionStrategy around the configured strategy, or default strategy chain
    const baseStrategy = this.strategy ?? new RetryingExecutionStrategy(new StandardExecutionStrategy());
    runner.setExecutionStrategy(new LoopingExecutionStrategy(baseStrategy));

    if (this.useCaching) {
      runner.withCache(this.cacheProvider);
    }

    (
      Object.keys(this.listeners) as Array<keyof RunnerEventPayloads<TContext>>
    ).forEach((event) => {
      const callbacks = this.listeners[event];
      // callbacks is always defined because we are iterating keys of the object
      callbacks!.forEach((callback) =>
        runner.on(
          event,
          callback as unknown as RunnerEventListener<
            TContext,
            keyof RunnerEventPayloads<TContext>
          >
        )
      );
    });

    return runner;
  }
}
