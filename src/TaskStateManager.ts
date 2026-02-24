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

  // Optimization structures
  private dependencyGraph = new Map<string, TaskStep<TContext>[]>();
  private dependencyCounts = new Map<string, number>();
  private readyQueue: TaskStep<TContext>[] = [];
  private taskDefinitions = new Map<string, TaskStep<TContext>>();

  constructor(private eventBus: EventBus<TContext>) {}

  /**
   * Initializes the state with the given steps.
   * @param steps The steps to execute.
   */
  initialize(steps: TaskStep<TContext>[]): void {
    this.pendingSteps = new Set(steps);
    this.results.clear();
    this.running.clear();
    this.readyQueue = [];

    this.dependencyGraph.clear();
    this.dependencyCounts.clear();
    this.taskDefinitions.clear();

    for (const step of steps) {
      this.taskDefinitions.set(step.name, step);
      const deps = step.dependencies ?? [];
      this.dependencyCounts.set(step.name, deps.length);

      if (deps.length === 0) {
        this.readyQueue.push(step);
      } else {
        for (const dep of deps) {
          let dependents = this.dependencyGraph.get(dep);
          if (dependents === undefined) {
            dependents = [];
            this.dependencyGraph.set(dep, dependents);
          }
          dependents.push(step);
        }
      }
    }
  }

  /**
   * Processes the pending steps to identify tasks that can be started.
   * Emits `taskSkipped` for skipped tasks (handled during cascade).
   * @returns An array of tasks that are ready to run.
   */
  processDependencies(): TaskStep<TContext>[] {
    const toRun = [...this.readyQueue];
    this.readyQueue = [];

    // Remove them from pendingSteps as they are now handed off to the executor
    for (const step of toRun) {
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

    if (result.status === "success") {
      this.handleSuccess(step.name);
    } else if (result.status === "failure") {
      // If continueOnError is true, treat as success for dependents to unblock the workflow
      if (this.taskDefinitions.get(step.name)?.continueOnError) {
        this.handleSuccess(step.name);
      } else {
        this.cascadeFailure(step.name);
      }
    } else {
      this.cascadeFailure(step.name);
    }
  }

  /**
   * Marks a task as skipped and emits `taskSkipped`.
   * @param step The task that was skipped.
   * @param result The result object (status: skipped).
   */
  markSkipped(step: TaskStep<TContext>, result: TaskResult): void {
    if (this.internalMarkSkipped(step, result)) {
      this.cascadeFailure(step.name);
    }
  }

  /**
   * Internal method to mark skipped without triggering cascade (to be used inside cascade loop).
   * Returns true if the task was actually marked skipped (was not already finished).
   */
  private internalMarkSkipped(step: TaskStep<TContext>, result: TaskResult): boolean {
    if (this.results.has(step.name)) {
      return false;
    }

    this.running.delete(step.name);
    this.results.set(step.name, result);
    this.pendingSteps.delete(step);
    this.eventBus.emit("taskSkipped", { step, result });
    return true;
  }

  /**
   * Cancels all pending tasks that haven't started yet.
   * @param message The cancellation message.
   */
  cancelAllPending(message: string): void {
    this.readyQueue = []; // Clear ready queue

    // Iterate over pendingSteps to cancel them
    for (const step of this.pendingSteps) {
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
   * Handles successful completion of a task by updating dependents.
   */
  private handleSuccess(stepName: string): void {
    const dependents = this.dependencyGraph.get(stepName);
    if (!dependents) return;

    for (const dependent of dependents) {
      const currentCount = this.dependencyCounts.get(dependent.name)!;
      const newCount = currentCount - 1;
      this.dependencyCounts.set(dependent.name, newCount);

      if (newCount === 0) {
        // Task is ready. Ensure it's still pending.
        if (this.pendingSteps.has(dependent)) {
          this.readyQueue.push(dependent);
        }
      }
    }
  }

  /**
   * Cascades failure/skipping to dependents.
   */
  private cascadeFailure(failedStepName: string): void {
    const queue = [failedStepName];
    // Optimization: Use index pointer instead of shift() to avoid O(N) array re-indexing
    let head = 0;
    // Use a set to track visited nodes in this cascade pass to avoid redundant processing,
    // although checking results.has() in internalMarkSkipped also prevents it.

    while (head < queue.length) {
      const currentName = queue[head++];
      const dependents = this.dependencyGraph.get(currentName);

      if (!dependents) continue;

      // Get the result of the failed/skipped dependency to propagate error info if available
      const currentResult = this.results.get(currentName);
      const depError = currentResult?.error ? `: ${currentResult.error}` : "";

      for (const dependent of dependents) {
        const result: TaskResult = {
          status: "skipped",
          message: `Skipped because dependency '${currentName}' failed${depError}`,
        };

        if (this.internalMarkSkipped(dependent, result)) {
          queue.push(dependent.name);
        }
      }
    }
  }
}
