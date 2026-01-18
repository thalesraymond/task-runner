import { TaskStep } from "./TaskStep.js";
import { TaskResult } from "./TaskResult.js";
import { TaskGraphValidator } from "./TaskGraphValidator.js";
import { TaskGraph } from "./TaskGraph.js";

/**
 * Define the payload for every possible event in the lifecycle.
 */
export interface RunnerEventPayloads<TContext> {
  workflowStart: {
    context: TContext;
    steps: TaskStep<TContext>[];
  };
  workflowEnd: {
    context: TContext;
    results: Map<string, TaskResult>;
  };
  taskStart: {
    step: TaskStep<TContext>;
  };
  taskEnd: {
    step: TaskStep<TContext>;
    result: TaskResult;
  };
  taskSkipped: {
    step: TaskStep<TContext>;
    result: TaskResult;
  };
}

/**
 * A generic listener type that maps the event key to its specific payload.
 */
export type RunnerEventListener<
  TContext,
  K extends keyof RunnerEventPayloads<TContext>,
> = (data: RunnerEventPayloads<TContext>[K]) => void | Promise<void>;

/**
 * Helper type for the listeners map to avoid private access issues in generic contexts.
 */
type ListenerMap<TContext> = {
  [K in keyof RunnerEventPayloads<TContext>]?: Set<
    RunnerEventListener<TContext, K>
  >;
};

/**
 * The main class that orchestrates the execution of a list of tasks
 * based on their dependencies, with support for parallel execution.
 * @template TContext The shape of the shared context object.
 */
export class TaskRunner<TContext> {
  private running = new Set<string>();
  private listeners: ListenerMap<TContext> = {};
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
    if (!this.listeners[event]) {
      // Type assertion needed because TypeScript cannot verify that the generic K
      // matches the specific key in the mapped type during assignment.
      this.listeners[event] = new Set() as unknown as ListenerMap<TContext>[K];
    }
    // Type assertion needed to tell TS that this specific Set matches the callback type
    (this.listeners[event] as Set<RunnerEventListener<TContext, K>>).add(
      callback
    );
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
    if (this.listeners[event]) {
      (this.listeners[event] as Set<RunnerEventListener<TContext, K>>).delete(
        callback
      );
    }
  }

  /**
   * Emit an event to all subscribers.
   * @param event The event name.
   * @param data The payload for the event.
   */
  private emit<K extends keyof RunnerEventPayloads<TContext>>(
    event: K,
    data: RunnerEventPayloads<TContext>[K]
  ): void {
    const listeners = this.listeners[event] as
      | Set<RunnerEventListener<TContext, K>>
      | undefined;
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(data);
        } catch (error) {
          // Prevent listener errors from bubbling up
          console.error(
            `Error in event listener for ${String(event)}:`,
            error
          );
        }
      }
    }
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

    this.emit("workflowStart", { context: this.context, steps });

    const results = new Map<string, TaskResult>();

    while (results.size < steps.length) {
      const pendingSteps = steps.filter(
        (step) => !results.has(step.name) && !this.running.has(step.name)
      );

      const readySteps = pendingSteps.filter((step) => {
        const deps = step.dependencies ?? [];
        return deps.every(
          (dep) => results.has(dep) && results.get(dep)?.status === "success"
        );
      });

      // Skip tasks with failed dependencies
      for (const step of pendingSteps) {
        const deps = step.dependencies ?? [];
        const failedDep = deps.find(
          (dep) => results.has(dep) && results.get(dep)?.status !== "success"
        );
        if (failedDep) {
          const result: TaskResult = {
            status: "skipped",
            message: `Skipped due to failed dependency: ${failedDep}`,
          };
          results.set(step.name, result);
          this.emit("taskSkipped", { step, result });
        }
      }

      await Promise.all(
        readySteps.map(async (step) => {
          this.running.add(step.name);
          this.emit("taskStart", { step });
          try {
            const result = await step.run(this.context);
            results.set(step.name, result);
          } catch (e) {
            results.set(step.name, {
              status: "failure",
              error: e instanceof Error ? e.message : String(e),
            });
          } finally {
            this.running.delete(step.name);
            const result = results.get(step.name)!;
            this.emit("taskEnd", { step, result });
          }
        })
      );
    }

    this.emit("workflowEnd", { context: this.context, results });
    return results;
  }
}
