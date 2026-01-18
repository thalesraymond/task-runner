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
   * If true, the runner will simulate execution without running the actual tasks.
   * Useful for verifying the execution order and graph structure.
   */
  dryRun?: boolean;
}
