import { TaskStep } from "./TaskStep.js";
import { TaskResult } from "./TaskResult.js";
import { TaskGraphValidator } from "./TaskGraphValidator.js";
import { TaskGraph } from "./TaskGraph.js";
import { RunnerEventPayloads, RunnerEventListener } from "./contracts/RunnerEvents.js";
import { EventBus } from "./EventBus.js";
import { WorkflowExecutor } from "./WorkflowExecutor.js";

// Re-export types for backward compatibility
export { RunnerEventPayloads, RunnerEventListener };

/**
 * The main class that orchestrates the execution of a list of tasks
 * based on their dependencies, with support for parallel execution.
 * @template TContext The shape of the shared context object.
 */
export class TaskRunner<TContext> {
  private eventBus = new EventBus<TContext>();
  private validator = new TaskGraphValidator();

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
   * Executes a list of tasks, respecting their dependencies and running
   * independent tasks in parallel.
   * @param steps An array of TaskStep objects to be executed.
   * @returns A Promise that resolves to a Map where keys are task names
   * and values are the corresponding TaskResult objects.
   */
  async execute(steps: TaskStep<TContext>[]): Promise<Map<string, TaskResult>> {
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

    const executor = new WorkflowExecutor(this.context, this.eventBus);
    return executor.execute(steps);
  }
}
