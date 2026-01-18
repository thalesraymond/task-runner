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
      // Construct error message compatible with legacy tests
      const affectedTasks = new Set<string>();
      const errorDetails: string[] = [];

      for (const error of validationResult.errors) {
        errorDetails.push(error.message);
        switch (error.type) {
          case "cycle": {
            // details is { cyclePath: string[] }
            const path = (error.details as { cyclePath: string[] }).cyclePath;
            // The last element duplicates the first in the path representation, so valid unique tasks are slice(0, -1) or just all as Set handles uniq
            path.forEach((t) => affectedTasks.add(t));
            break;
          }
          case "missing_dependency": {
            // details is { taskId: string, missingDependencyId: string }
            const d = error.details as { taskId: string };
            affectedTasks.add(d.taskId);
            break;
          }
          case "duplicate_task": {
            const d = error.details as { taskId: string };
            affectedTasks.add(d.taskId);
            break;
          }
        }
      }

      // Legacy error format: "Circular dependency or missing dependency detected. Unable to run tasks: A, B"
      const taskList = Array.from(affectedTasks).join(", ");
      const legacyMessage = `Circular dependency or missing dependency detected. Unable to run tasks: ${taskList}`;
      const detailedMessage = `Task graph validation failed: ${errorDetails.join("; ")}`;

      // Combine them to satisfy both legacy tests (checking for legacy message) and new requirements (clear details)
      throw new Error(`${legacyMessage} | ${detailedMessage}`);
    }

    const executor = new WorkflowExecutor(this.context, this.eventBus);
    return executor.execute(steps);
  }
}
