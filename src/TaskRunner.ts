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
  constructor(private context: TContext) { }

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
    /* v8 ignore next 1 */
    this.eventBus.off(event, callback);
  }

  /**
   * Sets the execution strategy to be used.
   * @param strategy The execution strategy.
   * @returns The TaskRunner instance for chaining.
   */
  public setExecutionStrategy(strategy: IExecutionStrategy<TContext>): this {
    /* v8 ignore next 2 */
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
    const nameToIdMap = new Map<string, string>();
    const usedIds = new Set<string>();

    const safeLabel = (name: string) => JSON.stringify(name);
    const sanitize = (name: string) => this.toMermaidId(name);

    // First pass: generate unique IDs for all steps
    for (const step of steps) {
      let id = sanitize(step.name);
      let counter = 1;
      const originalId = id;

      while (usedIds.has(id)) {
        id = `${originalId}_${counter}`;
        counter++;
      }

      usedIds.add(id);
      nameToIdMap.set(step.name, id);
    }

    // Add nodes
    for (const step of steps) {
      const id = nameToIdMap.get(step.name);
      /* v8 ignore start */
      if (id) {
        graphLines.push(`  ${id}[${safeLabel(step.name)}]`);
      }
      /* v8 ignore stop */
    }

    // Add edges
    for (const step of steps) {
      if (step.dependencies) {
        for (const dep of step.dependencies) {
          const fromId = nameToIdMap.get(dep);

          if (fromId) {
            const toId = nameToIdMap.get(step.name);
            /* v8 ignore start */
            if (toId) {
              graphLines.push(`  ${fromId} --> ${toId}`);
            }
            /* v8 ignore stop */
          }
        }
      }
    }

    return [...new Set(graphLines)].join("\n");
  }

  /**
   * Converts a string into a valid and clean Mermaid node ID.
   * Replaces non-alphanumeric characters with underscores, collapses multiple underscores,
   * and trims leading/trailing underscores.
   * @param id The string to sanitize.
   * @returns The sanitized string.
   */
  private static toMermaidId(id: string): string {
    return id
      .replace(/[^a-zA-Z0-9]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "");
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

    // We need to handle the timeout cleanup properly.
    if (config?.timeout !== undefined) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort(
          new Error(`Workflow timed out after ${config.timeout}ms`)
        );
      }, config.timeout);

      let effectiveSignal = controller.signal;
      let onAbort: (() => void) | undefined;

      // Handle combination of signals if user provided one
      if (config.signal) {
        if (config.signal.aborted) {
          // If already aborted, use it directly (WorkflowExecutor handles early abort)
          // We can cancel timeout immediately
          clearTimeout(timeoutId);
          effectiveSignal = config.signal;
        } else {
          // Listen to user signal to abort our controller
          onAbort = () => {
            controller.abort(config.signal?.reason);
          };
          config.signal.addEventListener("abort", onAbort);
        }
      }

      try {
        return await executor.execute(steps, effectiveSignal);
      } finally {
        clearTimeout(timeoutId);
        if (config.signal && onAbort) {
          config.signal.removeEventListener("abort", onAbort);
        }
      }
    } else {
      return executor.execute(steps, config?.signal);
    }
  }
}
