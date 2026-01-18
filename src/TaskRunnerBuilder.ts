import { TaskRunner } from "./TaskRunner.js";
import { RunnerEventPayloads, RunnerEventListener } from "./contracts/RunnerEvents.js";
import { IExecutionStrategy } from "./strategies/IExecutionStrategy.js";

/**
 * A builder for configuring and creating TaskRunner instances.
 */
export class TaskRunnerBuilder<TContext> {
  private context: TContext;
  private strategy?: IExecutionStrategy<TContext>;
  private listeners: {
    [K in keyof RunnerEventPayloads<TContext>]?: RunnerEventListener<TContext, K>[];
  } = {};

  /**
   * @param context The shared context object.
   */
  constructor(context: TContext) {
    this.context = context;
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

    if (this.strategy) {
      runner.setExecutionStrategy(this.strategy);
    }

    (Object.keys(this.listeners) as Array<keyof RunnerEventPayloads<TContext>>).forEach((event) => {
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
