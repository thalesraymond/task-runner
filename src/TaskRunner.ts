import { TaskStep } from "./TaskStep.js";
import { TaskResult } from "./TaskResult.js";
import { TaskGraphValidator } from "./TaskGraphValidator.js";
import { TaskGraph } from "./TaskGraph.js";
import { RunnerEventPayloads, RunnerEventListener } from "./contracts/RunnerEvents.js";
import { EventBus } from "./EventBus.js";
import { WorkflowExecutor } from "./WorkflowExecutor.js";
import { TaskRunnerExecutionConfig } from "./TaskRunnerExecutionConfig.js";
import { TaskStateManager } from "./TaskStateManager.js";
import { IExecutionStrategy } from "./strategies/IExecutionStrategy.js";
import { StandardExecutionStrategy } from "./strategies/StandardExecutionStrategy.js";

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
  private executionStrategy: IExecutionStrategy<TContext> = new StandardExecutionStrategy();

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
      throw new Error(this.validator.createErrorMessage(validationResult));
    }

    const stateManager = new TaskStateManager(this.eventBus);
    const executor = new WorkflowExecutor(
      this.context,
      this.eventBus,
      stateManager,
      this.executionStrategy
    );

    // We need to handle the timeout cleanup properly.
    if (config?.timeout !== undefined) {
       const controller = new AbortController();
       const timeoutId = setTimeout(() => {
         controller.abort(new Error(`Workflow timed out after ${config.timeout}ms`));
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
         return await executor.execute(steps, effectiveSignal, config?.dryRun);
       } finally {
         clearTimeout(timeoutId);
         if (config.signal && onAbort) {
            config.signal.removeEventListener("abort", onAbort);
         }
       }
    } else {
       return executor.execute(steps, config?.signal, config?.dryRun);
    }
  }

  /**
   * Generates a Mermaid.js graph representation of the workflow.
   * @param steps The list of task steps.
   * @returns A string containing the Mermaid graph definition.
   */
  static getMermaidGraph(steps: TaskStep<unknown>[]): string {
    const lines = ["graph TD"];
    const addedTasks = new Set<string>();

    for (const step of steps) {
      if (!step.dependencies || step.dependencies.length === 0) {
        if (!addedTasks.has(step.name)) {
          lines.push(`  ${step.name}`);
          addedTasks.add(step.name);
        }
      } else {
        for (const dep of step.dependencies) {
          lines.push(`  ${dep} --> ${step.name}`);
          addedTasks.add(step.name);
          addedTasks.add(dep);
        }
      }
    }

    // Ensure all tasks are mentioned even if they are isolated (though the logic above covers it mostly,
    // if a task is not in dependencies and has no dependencies, it's covered by the first if)
    // However, if a task is listed in 'steps' but only appears as a dependency of another task (which shouldn't happen in valid input ideally but possible),
    // or if the loop missed something.
    // The current loop covers:
    // 1. Tasks with no dependencies -> added as node.
    // 2. Tasks with dependencies -> edges added.
    // If a task is not in 'steps' but is a dependency, it will be added as part of the edge.
    // So this should be fine.

    return lines.join("\n");
  }
}
