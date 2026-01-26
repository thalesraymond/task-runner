import { TaskStep } from "./TaskStep.js";
import { TaskResult } from "./TaskResult.js";
import { TaskGraphValidator } from "./TaskGraphValidator.js";
import { TaskGraph } from "./TaskGraph.js";
import {
  RunnerEventPayloads,
  RunnerEventListener,
} from "./contracts/RunnerEvents.js";
import { EventBus } from "./EventBus.js";
import { WorkflowExecutor } from "./WorkflowExecutor.js";
import { TaskRunnerExecutionConfig } from "./TaskRunnerExecutionConfig.js";
import { TaskStateManager } from "./TaskStateManager.js";
import { TaskGraphValidationError } from "./TaskGraphValidationError.js";
import { IExecutionStrategy } from "./strategies/IExecutionStrategy.js";
import { StandardExecutionStrategy } from "./strategies/StandardExecutionStrategy.js";
import { RetryingExecutionStrategy } from "./strategies/RetryingExecutionStrategy.js";
import { DryRunExecutionStrategy } from "./strategies/DryRunExecutionStrategy.js";

// Re-export types for backward compatibility
export { RunnerEventPayloads, RunnerEventListener, TaskRunnerExecutionConfig };

/**
 * The main class that orchestrates the execution of a list of tasks
 * based on their dependencies, with support for parallel execution.
 * @template TContext The shape of the shared context object.
 */
export class TaskRunner<TContext> {
  private eventBus = new EventBus<TContext>();
  private validator = new TaskGraphValidator();
  private executionStrategy: IExecutionStrategy<TContext> =
    new RetryingExecutionStrategy(new StandardExecutionStrategy());

  /**
   * @param context The shared context object to be passed to each task.
   */
  constructor(private context: TContext) {}

  /**
   * Subscribe to an event.
   * @param event The event name.
   * @param callback The callback to execute when the event is emitted.
   */
  public on<K extends keyof RunnerEventPayloads<TContext>>(
    event: K,
    callback: RunnerEventListener<TContext, K>
  ): void {
    this.eventBus.on(event, callback);
  }

  /**
   * Unsubscribe from an event.
   * @param event The event name.
   * @param callback The callback to remove.
   */
  public off<K extends keyof RunnerEventPayloads<TContext>>(
    event: K,
    callback: RunnerEventListener<TContext, K>
  ): void {
    this.eventBus.off(event, callback);
  }

  /**
   * Sets the execution strategy to be used.
   * @param strategy The execution strategy.
   * @returns The TaskRunner instance for chaining.
   */
  public setExecutionStrategy(strategy: IExecutionStrategy<TContext>): this {
    this.executionStrategy = strategy;
    return this;
  }

  /**
   * Generates a Mermaid.js graph representation of the task workflow.
   * @param steps The list of tasks to visualize.
   * @returns A string containing the Mermaid graph definition.
   */
  public static getMermaidGraph<T>(steps: TaskStep<T>[]): string {
    const graphLines = ["graph TD"];
    const idMap = new Map<string, string>();
    const usedIds = new Set<string>();
    const baseIdCounters = new Map<string, number>();

    const getUniqueId = (name: string) => {
      const existingId = idMap.get(name);
      if (existingId !== undefined) {
        return existingId;
      }

      const sanitized = this.sanitizeMermaidId(name);
      let uniqueId = sanitized;

      // First check if the base sanitized ID is available
      if (!usedIds.has(uniqueId)) {
        usedIds.add(uniqueId);
        idMap.set(name, uniqueId);
        return uniqueId;
      }

      // If not, use the counter for this base ID
      let counter = baseIdCounters.get(sanitized) || 1;

      while (usedIds.has(uniqueId)) {
        uniqueId = `${sanitized}_${counter}`;
        counter++;
      }

      baseIdCounters.set(sanitized, counter);

      usedIds.add(uniqueId);
      idMap.set(name, uniqueId);
      return uniqueId;
    };

    // Pre-calculate IDs for all steps to ensure stable generation order
    // We sort steps by name to ensure deterministic ID generation regardless of input order if names clash
    // But input order is usually significant in graph definition, so we'll stick to input order.
    // However, we must process all step NAMES first.
    for (const step of steps) {
      getUniqueId(step.name);
    }

    for (const step of steps) {
      const stepId = getUniqueId(step.name);
      graphLines.push(`  ${stepId}[${JSON.stringify(step.name)}]`);
    }

    for (const step of steps) {
      if (step.dependencies) {
        const stepId = getUniqueId(step.name);
        for (const dep of step.dependencies) {
          const depId = getUniqueId(dep);
          graphLines.push(`  ${depId} --> ${stepId}`);
        }
      }
    }

    return [...new Set(graphLines)].join("\n");
  }

  /**
   * Sanitizes a string for use as a Mermaid node ID.
   * @param id The string to sanitize.
   * @returns The sanitized string.
   */
  private static sanitizeMermaidId(id: string): string {
    return id.replace(/[^a-zA-Z0-9_-]/g, "_");
  }

  /**
   * Executes a list of tasks, respecting their dependencies and running
   * independent tasks in parallel.
   * @param steps An array of TaskStep objects to be executed.
   * @param config Optional configuration for execution (timeout, cancellation).
   * @returns A Promise that resolves to a Map where keys are task names
   * and values are the corresponding TaskResult objects.
   */
  async execute(
    steps: TaskStep<TContext>[],
    config?: TaskRunnerExecutionConfig
  ): Promise<Map<string, TaskResult>> {
    // Validate the task graph before execution
    const taskGraph: TaskGraph = {
      tasks: steps.map((step) => ({
        id: step.name,
        dependencies: step.dependencies ?? [],
      })),
    };

    const validationResult = this.validator.validate(taskGraph);
    if (!validationResult.isValid) {
      throw new TaskGraphValidationError(
        validationResult,
        this.validator.createErrorMessage(validationResult)
      );
    }

    const stateManager = new TaskStateManager(this.eventBus);

    let strategy = this.executionStrategy;
    if (config?.dryRun) {
      strategy = new DryRunExecutionStrategy<TContext>();
    }

    const executor = new WorkflowExecutor(
      this.context,
      this.eventBus,
      stateManager,
      strategy,
      config?.concurrency
    );

    if (config?.timeout !== undefined) {
      return this.executeWithTimeout(
        executor,
        steps,
        config.timeout,
        config.signal
      );
    }

    return executor.execute(steps, config?.signal);
  }

  /**
   * Executes tasks with a timeout, ensuring resources are cleaned up.
   */
  private async executeWithTimeout(
    executor: WorkflowExecutor<TContext>,
    steps: TaskStep<TContext>[],
    timeout: number,
    signal?: AbortSignal
  ): Promise<Map<string, TaskResult>> {
    // Create a timeout signal that aborts after the specified time
    const timeoutSignal = AbortSignal.timeout(timeout);

    // If there's a user-provided signal, combine them.
    // Otherwise, use the timeout signal directly.
    const effectiveSignal = signal
      ? AbortSignal.any([signal, timeoutSignal])
      : timeoutSignal;

    return executor.execute(steps, effectiveSignal);
    // No explicit clean up needed for AbortSignal.timeout as it is handled by the platform
  }
}
