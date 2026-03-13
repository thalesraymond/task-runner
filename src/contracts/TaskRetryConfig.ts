export interface TaskRetryConfig {
  /** Number of retries (excluding the initial run). */
  attempts: number;
  /** Delay in milliseconds between retries. */
  delay: number;
  /** Backoff strategy: 'fixed' (default) or 'exponential'. */
  backoff?: "fixed" | "exponential";
  /** Optional predicate to determine if a retry should be attempted. Return true to retry, false to abort. */
  shouldRetry?: (error: unknown) => boolean;
}
