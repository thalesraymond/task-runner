import { TaskStep } from "./TaskStep.js";
import { TaskResult } from "./TaskResult.js";

/**
 * The main class that orchestrates the execution of a list of tasks
 * based on their dependencies, with support for parallel execution.
 * @template TContext The shape of the shared context object.
 */
export class TaskRunner<TContext> {
  private running = new Set<string>();

  /**
   * @param context The shared context object to be passed to each task.
   */
  constructor(private context: TContext) {}

  /**
   * Executes a list of tasks, respecting their dependencies and running
   * independent tasks in parallel.
   * @param steps An array of TaskStep objects to be executed.
   * @returns A Promise that resolves to a Map where keys are task names
   * and values are the corresponding TaskResult objects.
   */
  async execute(steps: TaskStep<TContext>[]): Promise<Map<string, TaskResult>> {
    const results = new Map<string, TaskResult>();

    while (results.size < steps.length) {
      const pendingSteps = steps.filter(
        (step) => !results.has(step.name) && !this.running.has(step.name)
      );

      const readySteps = pendingSteps.filter((step) => {
        const deps = step.dependencies ?? [];
        return deps.every(
          (dep) => results.has(dep) && results.get(dep)?.status === "success"
        );
      });

      // Skip tasks with failed dependencies
      for (const step of pendingSteps) {
        if (results.has(step.name)) continue;
        const deps = step.dependencies ?? [];
        const failedDep = deps.find(
          (dep) => results.has(dep) && results.get(dep)?.status !== "success"
        );
        if (failedDep) {
          results.set(step.name, {
            status: "skipped",
            message: `Skipped due to failed dependency: ${failedDep}`,
          });
        }
      }

      if (
        readySteps.length === 0 &&
        this.running.size === 0 &&
        results.size < steps.length
      ) {
        const unrunnableSteps = steps.filter((s) => !results.has(s.name));
        const unrunnableStepNames = unrunnableSteps.map((s) => s.name);
        throw new Error(
          `Circular dependency or missing dependency detected. Unable to run tasks: ${unrunnableStepNames.join(", ")}`
        );
      }

      await Promise.all(
        readySteps.map(async (step) => {
          this.running.add(step.name);
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
          }
        })
      );
    }

    return results;
  }
}
