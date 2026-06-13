import { TaskResult } from "../TaskResult.js";

/**
 * Configuration for looping (polling) a task until a condition is met.
 * @template TContext The shape of the shared context object.
 */
export interface TaskLoopConfig<TContext> {
  /**
   * Time in milliseconds to wait between iterations.
   * Default is 0.
   */
  interval?: number;

  /**
   * Maximum number of iterations to attempt before failing.
   * Default is 1.
   */
  maxIterations?: number;

  /**
   * A predicate function that determines when the loop should stop.
   * The loop stops and the task completes successfully when this returns true.
   * @param context The shared context object.
   * @param result The result of the task execution.
   * @returns A boolean indicating whether the loop should stop.
   */
  until: (context: TContext, result: TaskResult) => boolean;
}
