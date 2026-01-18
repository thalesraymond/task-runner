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
   * If true, tasks will be simulated (success) without running side effects.
   */
  dryRun?: boolean;
}
