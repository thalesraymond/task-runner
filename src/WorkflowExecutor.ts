import { TaskStep } from "./TaskStep.js";
import { TaskResult } from "./TaskResult.js";
import { EventBus } from "./EventBus.js";

/**
 * Handles the execution of the workflow steps.
 * @template TContext The shape of the shared context object.
 */
export class WorkflowExecutor<TContext> {
  private running = new Set<string>();

  /**
   * @param context The shared context object.
   * @param eventBus The event bus to emit events.
   */
  constructor(
    private context: TContext,
    private eventBus: EventBus<TContext>
  ) {}

  /**
   * Executes the given steps.
   * @param steps The list of steps to execute.
   * @param signal Optional AbortSignal for cancellation.
   * @returns A Promise that resolves to a map of task results.
   */
  async execute(
    steps: TaskStep<TContext>[],
    signal?: AbortSignal
  ): Promise<Map<string, TaskResult>> {
    this.eventBus.emit("workflowStart", { context: this.context, steps });

    const results = new Map<string, TaskResult>();

    // Check if already aborted
    if (signal?.aborted) {
      this.cancelAllPending(steps, results, "Workflow cancelled before execution started.");
      this.eventBus.emit("workflowEnd", { context: this.context, results });
      return results;
    }

    const executingPromises = new Set<Promise<void>>();
    const pendingSteps = new Set(steps);

    const onAbort = () => {
      // Mark all non-started, non-completed tasks as cancelled
      this.cancelAllPending(steps, results, "Workflow cancelled.");
    };

    if (signal) {
       signal.addEventListener("abort", onAbort);
    }

    try {
      // Initial pass
      this.processQueue(pendingSteps, results, executingPromises, signal);

      while (results.size < steps.length && executingPromises.size > 0) {

        // Wait for the next task to finish
        await Promise.race(executingPromises);

        if (signal?.aborted) {
           // If aborted, we don't start new tasks.
           // Pending tasks should have been cancelled by the event listener?
           // We ensure they are cancelled here too to be safe.
           this.cancelAllPending(steps, results, "Workflow cancelled.");
        } else {
           // After a task finishes, check for new work
           this.processQueue(pendingSteps, results, executingPromises, signal);
        }
      }

      // Ensure everything is accounted for
      this.cancelAllPending(steps, results, "Workflow cancelled.");

      this.eventBus.emit("workflowEnd", { context: this.context, results });
      return results;
    } finally {
      if (signal) {
        signal.removeEventListener("abort", onAbort);
      }
    }
  }

  /**
   * Logic to identify tasks that can be started or must be skipped.
   * Iterate only over pending steps to avoid O(N^2) checks on completed tasks.
   */
  private processQueue(
    pendingSteps: Set<TaskStep<TContext>>,
    results: Map<string, TaskResult>,
    executingPromises: Set<Promise<void>>,
    signal?: AbortSignal
  ): void {
    const toRemove: TaskStep<TContext>[] = [];
    const toRun: TaskStep<TContext>[] = [];

    for (const step of pendingSteps) {
      const deps = step.dependencies ?? [];
      let blocked = false;
      let failedDep: string | undefined;

      for (const dep of deps) {
        const depResult = results.get(dep);
        if (!depResult) {
          // Dependency not finished yet
          blocked = true;
        } else if (depResult.status !== "success") {
          failedDep = dep;
          break;
        }
      }

      if (failedDep) {
        const result: TaskResult = {
          status: "skipped",
          message: `Skipped due to failed dependency: ${failedDep}`,
        };
        results.set(step.name, result);
        this.eventBus.emit("taskSkipped", { step, result });
        toRemove.push(step);
      } else if (!blocked) {
        toRun.push(step);
        toRemove.push(step);
      }
    }

    // Cleanup pending set
    for (const step of toRemove) {
      pendingSteps.delete(step);
    }

    // Execute ready tasks
    for (const step of toRun) {
      const taskPromise = this.runStep(step, results, signal).then(() => {
        executingPromises.delete(taskPromise);
      });
      executingPromises.add(taskPromise);
    }
  }

  /**
   * Handles the lifecycle of a single task execution.
   */
  private async runStep(
    step: TaskStep<TContext>,
    results: Map<string, TaskResult>,
    signal?: AbortSignal
  ): Promise<void> {
    this.running.add(step.name);
    this.eventBus.emit("taskStart", { step });

    try {
      const result = await step.run(this.context, signal);
      results.set(step.name, result);
    } catch (e) {
       // Check if error is due to abort
       if (signal?.aborted && (e instanceof Error && e.name === "AbortError" || signal.reason === e)) {
          results.set(step.name, {
             status: "cancelled",
             message: "Task cancelled during execution",
          });
       } else {
          results.set(step.name, {
            status: "failure",
            error: e instanceof Error ? e.message : String(e),
          });
       }
    } finally {
      this.running.delete(step.name);
      const result = results.get(step.name)!;
      this.eventBus.emit("taskEnd", { step, result });
    }
  }

  /**
   * Marks all pending tasks as cancelled.
   */
  private cancelAllPending(
    steps: TaskStep<TContext>[],
    results: Map<string, TaskResult>,
    message: string
  ): void {
    for (const step of steps) {
      if (!results.has(step.name) && !this.running.has(step.name)) {
        const result: TaskResult = {
          status: "cancelled",
          message,
        };
        results.set(step.name, result);
      }
    }
  }
}
