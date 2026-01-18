/**
 * Configuration for task retry logic.
 */
export interface TaskRetryConfig {
  /**
   * Number of retry attempts.
   * e.g., 3 means the task will be retried up to 3 times after the initial failure.
   */
  attempts: number;

  /**
   * Delay in milliseconds between retries.
   * Defaults to 0 if not specified.
   */
  delay?: number;

  /**
   * Backoff strategy.
   * - 'fixed': Constant delay between retries.
   * - 'exponential': Delay increases exponentially (delay * 2^attempt).
   * Defaults to 'fixed'.
   */
  backoff?: 'fixed' | 'exponential';
}
