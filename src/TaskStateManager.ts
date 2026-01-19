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
  private dependencyGraph = new Map<string, Set<TaskStep<TContext>>>();

  constructor(private eventBus: EventBus<TContext>) {}

  /**
   * Initializes the state with the given steps.
   * @param steps The steps to execute.
   */
  initialize(steps: TaskStep<TContext>[]): void {
    this.pendingSteps = new Set(steps);
    this.results.clear();
    this.running.clear();
    this.dependencyGraph.clear();

    for (const step of steps) {
      for (const depName of step.dependencies || []) {
        if (!this.dependencyGraph.has(depName)) {
          this.dependencyGraph.set(depName, new Set());
        }
        this.dependencyGraph.get(depName)!.add(step);
      }
    }
  }

  /**
   * Processes the pending steps to identify tasks that can be started or must be skipped.
   * Emits `taskSkipped` for skipped tasks.
   * @param triggerTaskName Optional name of the task that just finished, to optimize the check.
   * @returns An array of tasks that are ready to run.
   */
  processDependencies(triggerTaskName?: string): TaskStep<TContext>[] {
    const toRun: TaskStep<TContext>[] = [];

    // Queue of steps to check.
    // If triggered by a task, start with its dependents.
    // Otherwise (initial), check all pending steps.
    let queue: TaskStep<TContext>[];

    if (triggerTaskName) {
      const dependents = this.dependencyGraph.get(triggerTaskName);
      queue = dependents ? Array.from(dependents) : [];
    } else {
      queue = Array.from(this.pendingSteps);
    }

    const processedInThisPass = new Set<string>();
    let head = 0;

    while (head < queue.length) {
      const step = queue[head++];

      // Optimization: Avoid re-checking the same step multiple times in one pass
      if (processedInThisPass.has(step.name)) continue;
      processedInThisPass.add(step.name);

      // Verify it's still pending
      if (!this.pendingSteps.has(step)) continue;

      const deps = step.dependencies ?? [];
      let blocked = false;
      let failedDep: string | undefined;

      for (const dep of deps) {
        const depResult = this.results.get(dep);
        if (!depResult) {
          // Dependency not finished yet
          blocked = true;
        } else if (depResult.status !== "success") {
          failedDep = dep;
          break;
        }
      }

      if (failedDep) {
        const depResult = this.results.get(failedDep);
        const depError = depResult?.error ? `: ${depResult.error}` : "";
        const result: TaskResult = {
          status: "skipped",
          message: `Skipped because dependency '${failedDep}' failed${depError}`,
        };
        this.markSkipped(step, result);
        this.pendingSteps.delete(step);

        // Propagate: Add dependents to queue to ensure they are also skipped in this pass
        const dependents = this.dependencyGraph.get(step.name);
        if (dependents) {
          for (const depStep of dependents) {
            queue.push(depStep);
          }
        }
      } else if (!blocked) {
        toRun.push(step);
        this.pendingSteps.delete(step);
      }
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
      /* v8 ignore next 1 */
      if (!this.results.has(step.name) && !this.running.has(step.name)) {
        const result: TaskResult = {
          status: "cancelled",
          message,
        };
        this.results.set(step.name, result);
      }
    }
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
}
