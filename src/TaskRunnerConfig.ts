/**
 * Configuration options for the TaskRunner execution.
 */
export interface TaskRunnerConfig {
  /**
   * An AbortSignal to externally cancel the workflow.
   */
  signal?: AbortSignal;
  /**
   * A global timeout in milliseconds for the entire workflow.
   */
  timeout?: number;
}
