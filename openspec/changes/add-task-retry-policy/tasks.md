## Implementation
- [ ] 1.1 Create `TaskRetryConfig` interface with `attempts`, `delay`, and `backoff`.
- [ ] 1.2 Update `TaskStep` interface to include optional `retry: TaskRetryConfig`.
- [ ] 1.3 Update execution logic to catch task failures.
- [ ] 1.4 Implement retry loop/recursion checking `attempts` count.
- [ ] 1.5 Implement delay logic with support for `fixed` and `exponential` backoff.
- [ ] 1.6 Ensure `TaskResult` reflects the final status after retries (success if eventually succeeds, failure if all attempts fail).
- [ ] 1.7 Add unit tests for successful retry after failure.
- [ ] 1.8 Add unit tests for exhaustion of retry attempts (final failure).
- [ ] 1.9 Add unit tests for backoff timing (mock timers).
