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
  private readyQueue: TaskStep<TContext>[] = [];

  /**
   * @param context The shared context object.
   * @param eventBus The event bus to emit events.
   * @param stateManager Manages execution state.
   * @param strategy Execution strategy.
   * @param concurrency Maximum number of concurrent tasks.
   */
  constructor(
    private context: TContext,
    private eventBus: EventBus<TContext>,
    private stateManager: TaskStateManager<TContext>,
    private strategy: IExecutionStrategy<TContext>,
    private concurrency?: number
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
      this.processLoop(executingPromises, signal);

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
           this.processLoop(executingPromises, signal);
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
    signal?: AbortSignal
  ): void {
    const newlyReady = this.stateManager.processDependencies();

    // Add newly ready tasks to the queue
    for (const task of newlyReady) {
      // Prevent duplicates in the queue
      if (!this.readyQueue.some(t => t.name === task.name)) {
        this.readyQueue.push(task);
      }
    }

    // Execute ready tasks while respecting concurrency limit
    while (this.readyQueue.length > 0) {
      if (
        this.concurrency !== undefined &&
        executingPromises.size >= this.concurrency
      ) {
        break;
      }

      const step = this.readyQueue.shift();
      if (!step) break;

      this.stateManager.markRunning(step);

      const taskPromise = this.strategy.execute(step, this.context, signal)
        .then((result) => {
            this.stateManager.markCompleted(step, result);
        })
        .finally(() => {
             executingPromises.delete(taskPromise);
             // When a task finishes, we try to run more
             this.processLoop(executingPromises, signal);
        });

      executingPromises.add(taskPromise);
    }
  }
}
