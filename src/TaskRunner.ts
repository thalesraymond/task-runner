import { TaskStep } from "./TaskStep.js";
import { TaskResult } from "./TaskResult.js";
import { TaskGraphValidator } from "./TaskGraphValidator.js";
import { TaskGraph } from "./TaskGraph.js";
import { TaskRunnerConfig } from "./TaskRunnerConfig.js";

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
   * @param config Optional configuration for execution, including concurrency limits.
   * @returns A Promise that resolves to a Map where keys are task names
   * and values are the corresponding TaskResult objects.
   */
  async execute(
    steps: TaskStep<TContext>[],
    config?: TaskRunnerConfig
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
    const executingPromises = new Set<Promise<void>>();
    const concurrencyLimit =
      config?.concurrency !== undefined && config.concurrency > 0
        ? config.concurrency
        : Infinity;

    // Helper to process pending steps and launch ready ones
    const processPendingSteps = () => {
      // 1. Identify and mark skipped tasks
      // We loop until no more tasks can be skipped in this pass to handle chains of skips
      let changed = true;
      while (changed) {
        changed = false;
        const pendingSteps = steps.filter(
          (step) => !results.has(step.name) && !this.running.has(step.name)
        );

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
            changed = true;
          }
        }
      }

      // 2. Identify ready tasks
      const readySteps = steps.filter((step) => {
        if (results.has(step.name) || this.running.has(step.name)) return false;
        const deps = step.dependencies ?? [];
        return deps.every(
          (dep) => results.has(dep) && results.get(dep)?.status === "success"
        );
      });

      // 3. Launch ready tasks respecting concurrency
      const freeSlots = concurrencyLimit - this.running.size;
      const tasksToStart = readySteps.slice(0, freeSlots);

      for (const step of tasksToStart) {
        this.running.add(step.name);
        this.emit("taskStart", { step });

        const taskPromise = (async () => {
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
        })();

        // Wrap the task promise to ensure we can track it in the Set
        const trackedPromise = taskPromise.then(() => {
          executingPromises.delete(trackedPromise);
        });
        executingPromises.add(trackedPromise);
      }
    };

    // Initial check to start independent tasks
    processPendingSteps();

    // Loop until all tasks are processed (either result set or running)
    // Note: checking executingPromises.size > 0 is important to wait for running tasks,
    // but we also need to ensure we don't exit if tasks are pending but not running (though that should mean deadlock or ready tasks waiting for slots?)
    // If results.size < steps.length, we must have either running tasks OR ready tasks (waiting for slots).
    // If we have ready tasks but no running tasks and no slots -> impossible unless concurrency is 0 (handled) or negative.
    // If we have no running tasks and no ready tasks but results.size < steps.length -> deadlock (validated away) or waiting for external event?
    // The main loop relies on executingPromises to wait.

    while (results.size < steps.length) {
      /* v8 ignore start */
      if (executingPromises.size === 0) {
        // If nothing is running and we haven't finished, and we are here,
        // it means we have no ready tasks (or we would have started them up to concurrency).
        // Since we validate graph, this implies strictly that we are done?
        // But results.size < steps.length.
        // This happens if processPendingSteps() didn't start anything.
        // Which implies readySteps is empty or freeSlots is 0.
        // If freeSlots is 0, then executingPromises.size MUST be > 0.
        // So if executingPromises.size === 0, then freeSlots > 0.
        // So readySteps must be empty.
        // If readySteps is empty and we are not done, and nothing running -> Deadlock/Unreachable.
        break;
      }
      /* v8 ignore stop */

      // Wait for the next task to finish
      await Promise.race(executingPromises);
      // After a task finishes, check for new work
      processPendingSteps();
    }

    this.emit("workflowEnd", { context: this.context, results });
    return results;
  }
}
