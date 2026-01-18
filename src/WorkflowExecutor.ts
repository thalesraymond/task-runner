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
   * @returns A Promise that resolves to a map of task results.
   */
  async execute(steps: TaskStep<TContext>[]): Promise<Map<string, TaskResult>> {
    this.eventBus.emit("workflowStart", { context: this.context, steps });

    const results = new Map<string, TaskResult>();
    const executingPromises = new Set<Promise<void>>();

    // Helper to process pending steps and launch ready ones
    const processPendingSteps = () => {
      const pendingSteps = steps.filter(
        (step) => !results.has(step.name) && !this.running.has(step.name)
      );

      // 1. Identify and mark skipped tasks
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

      // Re-filter pending steps as some might have been skipped above
      const readySteps = steps.filter((step) => {
        if (results.has(step.name) || this.running.has(step.name)) return false;
        const deps = step.dependencies ?? [];
        return deps.every(
          (dep) => results.has(dep) && results.get(dep)?.status === "success"
        );
      });

      // 2. Launch ready tasks
      for (const step of readySteps) {
        this.running.add(step.name);
        this.eventBus.emit("taskStart", { step });

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
            this.eventBus.emit("taskEnd", { step, result });
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

    while (results.size < steps.length && executingPromises.size > 0) {
      // Wait for the next task to finish
      await Promise.race(executingPromises);
      // After a task finishes, check for new work
      processPendingSteps();
    }

    this.eventBus.emit("workflowEnd", { context: this.context, results });
    return results;
  }
}
