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
}
