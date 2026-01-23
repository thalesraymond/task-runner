import { TaskStep } from "./TaskStep.js";
import { TaskResult } from "./TaskResult.js";
import { EventBus } from "./EventBus.js";

/**
 * Manages the state of the task execution, including results, pending steps, and running tasks.
 * Handles dependency resolution and event emission for state changes.
 */
export class TaskStateManager<TContext> {
  private results = new Map<string, TaskResult>();
  private pendingSteps = new Set<TaskStep<TContext>>();
  private running = new Set<string>();

  constructor(private eventBus: EventBus<TContext>) {}

  /**
   * Initializes the state with the given steps.
   * @param steps The steps to execute.
   */
  initialize(steps: TaskStep<TContext>[]): void {
    this.pendingSteps = new Set(steps);
    this.results.clear();
    this.running.clear();
  }

  /**
   * Processes the pending steps to identify tasks that can be started or must be skipped.
   * Emits `taskSkipped` for skipped tasks.
   * @returns An array of tasks that are ready to run.
   */
  processDependencies(): TaskStep<TContext>[] {
    const toRemove: TaskStep<TContext>[] = [];
    const toRun: TaskStep<TContext>[] = [];

    for (const step of this.pendingSteps) {
      const depStatus = this.checkDependencyStatus(step);

      if (depStatus.status === "failed") {
        const depError = depStatus.error ? `: ${depStatus.error}` : "";
        const result: TaskResult = {
          status: "skipped",
          message: `Skipped because dependency '${depStatus.failedDep}' failed${depError}`,
        };

        this.markSkipped(step, result);
        
        toRemove.push(step);
      } else if (depStatus.status === "ready") {
        toRun.push(step);
        toRemove.push(step);
      }
    }

    // Cleanup pending set
    for (const step of toRemove) {
      this.pendingSteps.delete(step);
    }

    return toRun;
  }

  /**
   * Marks a task as running and emits `taskStart`.
   * @param step The task that is starting.
   */
  markRunning(step: TaskStep<TContext>): void {
    this.running.add(step.name);
    this.eventBus.emit("taskStart", { step });
  }

  /**
   * Marks a task as completed (success, failure, or cancelled during execution)
   * and emits `taskEnd`.
   * @param step The task that completed.
   * @param result The result of the task.
   */
  markCompleted(step: TaskStep<TContext>, result: TaskResult): void {
    this.running.delete(step.name);
    this.results.set(step.name, result);
    this.eventBus.emit("taskEnd", { step, result });
  }

  /**
   * Cancels all pending tasks that haven't started yet.
   * @param message The cancellation message.
   */
  cancelAllPending(message: string): void {
    // Iterate over pendingSteps to cancel them
    for (const step of this.pendingSteps) {
      // Also check running? No, running tasks are handled by AbortSignal in Executor.
      // We only cancel what is pending and hasn't started.
      if (!this.results.has(step.name) && !this.running.has(step.name)) {
        const result: TaskResult = {
          status: "cancelled",
          message,
        };
        this.results.set(step.name, result);
        this.eventBus.emit("taskEnd", { step, result });
      }
    }
    // Clear pending set as they are now "done" (cancelled)
    this.pendingSteps.clear();
  }

  /**
   * Returns the current results map.
   */
  getResults(): Map<string, TaskResult> {
    return this.results;
  }

  /**
   * Checks if there are any tasks currently running.
   */
  hasRunningTasks(): boolean {
    return this.running.size > 0;
  }

  /**
   * Checks if there are any pending tasks.
   */
  hasPendingTasks(): boolean {
    return this.pendingSteps.size > 0;
  }

  /**
   * Marks a task as skipped and emits `taskSkipped`.
   * @param step The task that was skipped.
   * @param result The result object (status: skipped).
   */
  markSkipped(step: TaskStep<TContext>, result: TaskResult): void {
    this.running.delete(step.name);
    this.results.set(step.name, result);
    this.eventBus.emit("taskSkipped", { step, result });
  }

  /**
   * Checks the status of a step's dependencies.
   */
  private checkDependencyStatus(step: TaskStep<TContext>):
    | { status: "ready" }
    | { status: "blocked" }
    | { status: "failed"; failedDep: string; error?: string } {
    const deps = step.dependencies ?? [];

    for (const dep of deps) {
      const depResult = this.results.get(dep);
      if (!depResult) {
        // Dependency not finished yet
        return { status: "blocked" };
      }
      if (depResult.status !== "success") {
        return {
          status: "failed",
          failedDep: dep,
          error: depResult.error,
        };
      }
    }

    return { status: "ready" };
  }
}
