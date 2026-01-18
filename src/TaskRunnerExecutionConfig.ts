/**
 * Configuration options for TaskRunner execution.
 */
export interface TaskRunnerExecutionConfig {
  /**
   * An AbortSignal to cancel the workflow externally.
   */
  signal?: AbortSignal;
  /**
   * A timeout in milliseconds for the entire workflow.
   */
  timeout?: number;
  /**
   * The maximum number of tasks to run concurrently.
   * If undefined, tasks will run with unlimited concurrency.
   */
  concurrency?: number;
}
