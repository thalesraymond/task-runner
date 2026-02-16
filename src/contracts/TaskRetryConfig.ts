export interface TaskRetryConfig {
  /** Number of retries (excluding the initial run). */
  attempts: number;
  /** Delay in milliseconds between retries. */
  delay: number;
  /** Backoff strategy: 'fixed' (default) or 'exponential'. */
  backoff?: "fixed" | "exponential";
  /**
   * Optional predicate to determine if a retry should be attempted based on the error.
   * If it returns false, the retry loop is broken immediately, and the failure result is returned.
   * If undefined, the existing behavior (retry on any failure) is preserved.
   */
  shouldRetry?: (error: unknown) => boolean;
}
