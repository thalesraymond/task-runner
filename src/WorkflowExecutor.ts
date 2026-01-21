import { TaskStep } from "./TaskStep.js";
import { TaskResult } from "./TaskResult.js";
import { EventBus } from "./EventBus.js";
import { TaskStateManager } from "./TaskStateManager.js";
import { IExecutionStrategy } from "./strategies/IExecutionStrategy.js";
import { ExecutionConstants } from "./ExecutionConstants.js";

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
      this.stateManager.cancelAllPending(
        ExecutionConstants.CANCELLED_BEFORE_START
      );
      const results = this.stateManager.getResults();
      this.eventBus.emit("workflowEnd", { context: this.context, results });
      return results;
    }

    const executingPromises = new Set<Promise<void>>();

    const onAbort = () => {
      // Mark all pending tasks as cancelled
      this.stateManager.cancelAllPending(ExecutionConstants.WORKFLOW_CANCELLED);
    };

    if (signal) {
      signal.addEventListener("abort", onAbort);
    }

    try {
      // Initial pass
      this.processLoop(executingPromises, signal);

      while (
        this.stateManager.hasPendingTasks() ||
        this.stateManager.hasRunningTasks() ||
        executingPromises.size > 0
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
          this.stateManager.cancelAllPending(
            ExecutionConstants.WORKFLOW_CANCELLED
          );
        } else {
          // After a task finishes, check for new work
          this.processLoop(executingPromises, signal);
        }
      }

      // Ensure everything is accounted for (e.g. if loop exited early)
      this.stateManager.cancelAllPending(ExecutionConstants.WORKFLOW_CANCELLED);

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
      this.readyQueue.push(task);
    }

    // Sort by priority (descending) once after adding new tasks
    this.readyQueue.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

    // Execute ready tasks while respecting concurrency limit
    while (this.readyQueue.length > 0) {
      if (
        this.concurrency !== undefined &&
        executingPromises.size >= this.concurrency
      ) {
        break;
      }

      const step = this.readyQueue.shift()!;

      const taskPromise = this.executeTaskStep(step, signal)
        .finally(() => {
          executingPromises.delete(taskPromise);
          // When a task finishes, we try to run more
          this.processLoop(executingPromises, signal);
        });

      executingPromises.add(taskPromise);
    }
  }

  /**
   * Executes a single task step, handling conditions and status updates.
   */
  private async executeTaskStep(
    step: TaskStep<TContext>,
    signal?: AbortSignal
  ): Promise<void> {
    try {
      if (step.condition) {
        const check = step.condition(this.context);
        const shouldRun = check instanceof Promise ? await check : check;

        if (signal?.aborted) {
          this.stateManager.markCompleted(step, {
            status: "cancelled",
            message: ExecutionConstants.CANCELLED_DURING_CONDITION,
          });
          return;
        }

        if (!shouldRun) {
          const result: TaskResult = {
            status: "skipped",
            message: ExecutionConstants.SKIPPED_BY_CONDITION,
          };
          this.stateManager.markSkipped(step, result);
          return;
        }
      }
    } catch (error) {
      const result: TaskResult = {
        status: "failure",
        message:
          error instanceof Error
            ? error.message
            : ExecutionConstants.CONDITION_EVALUATION_FAILED,
        error: error instanceof Error ? error.message : String(error),
      };
      this.stateManager.markCompleted(step, result);
      return;
    }

    if (signal?.aborted) {
      this.stateManager.markCompleted(step, {
        status: "cancelled",
        message: ExecutionConstants.TASK_CANCELLED_BEFORE_START,
      });
      return;
    }

    this.stateManager.markRunning(step);

    try {
      const result = await this.strategy.execute(step, this.context, signal);
      this.stateManager.markCompleted(step, result);
    } catch (error) {
      const result: TaskResult = {
        status: "failure",
        message: ExecutionConstants.EXECUTION_STRATEGY_FAILED,
        error: error instanceof Error ? error.message : String(error),
      };
      this.stateManager.markCompleted(step, result);
    }
  }
}
