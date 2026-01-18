import { TaskStep } from "./TaskStep.js";
import { TaskResult } from "./TaskResult.js";
import { EventBus } from "./EventBus.js";
import { TaskStateManager } from "./TaskStateManager.js";
import { IExecutionStrategy } from "./strategies/IExecutionStrategy.js";

/**
 * Handles the execution of the workflow steps.
 * @template TContext The shape of the shared context object.
 */
export class WorkflowExecutor<TContext> {
  /**
   * @param context The shared context object.
   * @param eventBus The event bus to emit events.
   * @param stateManager Manages execution state.
   * @param strategy Execution strategy.
   */
  constructor(
    private context: TContext,
    private eventBus: EventBus<TContext>,
    private stateManager: TaskStateManager<TContext>,
    private strategy: IExecutionStrategy<TContext>
  ) {}

  /**
   * Executes the given steps.
   * @param steps The list of steps to execute.
   * @param signal Optional AbortSignal for cancellation.
   * @param dryRun If true, simulates execution without running tasks.
   * @returns A Promise that resolves to a map of task results.
   */
  async execute(
    steps: TaskStep<TContext>[],
    signal?: AbortSignal,
    dryRun = false
  ): Promise<Map<string, TaskResult>> {
    this.eventBus.emit("workflowStart", { context: this.context, steps });
    this.stateManager.initialize(steps);

    // Check if already aborted
    if (signal?.aborted) {
      this.stateManager.cancelAllPending("Workflow cancelled before execution started.");
      const results = this.stateManager.getResults();
      this.eventBus.emit("workflowEnd", { context: this.context, results });
      return results;
    }

    const executingPromises = new Set<Promise<void>>();

    const onAbort = () => {
      // Mark all pending tasks as cancelled
      this.stateManager.cancelAllPending("Workflow cancelled.");
    };

    if (signal) {
       signal.addEventListener("abort", onAbort);
    }

    try {
      // Initial pass
      this.processLoop(executingPromises, signal, dryRun);

      while (
        this.stateManager.hasPendingTasks() ||
        this.stateManager.hasRunningTasks()
      ) {
        // Safety check: if no tasks are running and we still have pending tasks,
        // it means we are stuck (e.g. cycle or unhandled dependency).
        // Since valid graphs shouldn't have this, we break to avoid infinite loop.
        if (executingPromises.size === 0) {
          break;
        } else {
          // Wait for the next task to finish
          await Promise.race(executingPromises);
        }

        if (signal?.aborted) {
           this.stateManager.cancelAllPending("Workflow cancelled.");
        } else {
           // After a task finishes, check for new work
           this.processLoop(executingPromises, signal, dryRun);
        }
      }

      // Ensure everything is accounted for (e.g. if loop exited early)
      this.stateManager.cancelAllPending("Workflow cancelled.");

      const results = this.stateManager.getResults();
      this.eventBus.emit("workflowEnd", { context: this.context, results });
      return results;
    } finally {
      if (signal) {
        signal.removeEventListener("abort", onAbort);
      }
    }
  }

  /**
   * Logic to identify tasks that can be started and run them.
   */
  private processLoop(
    executingPromises: Set<Promise<void>>,
    signal?: AbortSignal,
    dryRun = false
  ): void {
    const toRun = this.stateManager.processDependencies();

    // Execute ready tasks
    for (const step of toRun) {
      this.stateManager.markRunning(step);

      let executionPromise: Promise<TaskResult>;

      if (dryRun) {
        // Simulate execution
        executionPromise = Promise.resolve({ status: "success" });
      } else {
        executionPromise = this.strategy.execute(step, this.context, signal);
      }

      const taskPromise = executionPromise
        .then((result) => {
          this.stateManager.markCompleted(step, result);
        })
        .finally(() => {
          executingPromises.delete(taskPromise);
        });

      executingPromises.add(taskPromise);
    }
  }
}
