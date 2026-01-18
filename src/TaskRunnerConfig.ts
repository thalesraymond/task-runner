/**
 * Configuration options for the TaskRunner execution.
 */
export interface TaskRunnerConfig {
  /**
   * The maximum number of tasks that can run concurrently.
   * - If not specified or set to `Infinity`, tasks will run with unlimited concurrency (default behavior).
   * - If set to `0`, it is treated as unlimited concurrency.
   * - If set to a positive number, execution is limited to that many concurrent tasks.
   */
  concurrency?: number;
}
