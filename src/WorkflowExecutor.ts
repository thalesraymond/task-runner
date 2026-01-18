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
   * @param signal Optional AbortSignal to stop execution.
   * @returns A Promise that resolves to a map of task results.
   */
  async execute(
    steps: TaskStep<TContext>[],
    signal?: AbortSignal
  ): Promise<Map<string, TaskResult>> {
    this.eventBus.emit("workflowStart", { context: this.context, steps });

    const results = new Map<string, TaskResult>();
    const executingPromises = new Set<Promise<void>>();

    // Initial pass
    this.processQueue(steps, results, executingPromises, signal);

    while (results.size < steps.length && executingPromises.size > 0) {
      // Wait for the next task to finish
      await Promise.race(executingPromises);

      // Check for cancellation
      if (signal?.aborted) {
        break;
      }

      // After a task finishes, check for new work
      this.processQueue(steps, results, executingPromises, signal);
    }

    this.eventBus.emit("workflowEnd", { context: this.context, results });
    return results;
  }

  /**
   * Logic to identify tasks that can be started or must be skipped.
   */
  private processQueue(
    steps: TaskStep<TContext>[],
    results: Map<string, TaskResult>,
    executingPromises: Set<Promise<void>>,
    signal?: AbortSignal
  ): void {
    if (signal?.aborted) return;

    this.handleSkippedTasks(steps, results);

    const readySteps = this.getReadySteps(steps, results);

    for (const step of readySteps) {
      const taskPromise = this.runStep(step, results, signal).then(() => {
        executingPromises.delete(taskPromise);
      });
      executingPromises.add(taskPromise);
    }
  }

  /**
   * Identifies steps that cannot run because a dependency failed.
   */
  private handleSkippedTasks(steps: TaskStep<TContext>[], results: Map<string, TaskResult>): void {
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
        this.eventBus.emit("taskSkipped", { step, result });
      }
    }
  }

  /**
   * Returns steps where all dependencies have finished successfully.
   */
  private getReadySteps(steps: TaskStep<TContext>[], results: Map<string, TaskResult>): TaskStep<TContext>[] {
    return steps.filter((step) => {
      if (results.has(step.name) || this.running.has(step.name)) return false;

      const deps = step.dependencies ?? [];
      return deps.every(
        (dep) => results.has(dep) && results.get(dep)?.status === "success"
      );
    });
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
      results.set(step.name, {
        status: "failure",
        error: e instanceof Error ? e.message : String(e),
      });
    } finally {
      this.running.delete(step.name);
      const result = results.get(step.name)!;
      this.eventBus.emit("taskEnd", { step, result });
    }
  }
}
