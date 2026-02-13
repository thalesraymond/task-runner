# Change: Conditional Retries

## Why

Currently, the `RetryingExecutionStrategy` treats all task failures equally. If a task has retry attempts configured, it will blindly retry even if the error is permanent (e.g., syntax error, invalid configuration) or logic-based (e.g., validation failure). This wastes resources and execution time. Users need a way to specify _which_ errors should trigger a retry, allowing them to fail fast on critical errors while retrying on transient ones (e.g., network timeouts).

## What Changes

- Update `TaskRetryConfig` interface in `src/contracts/TaskRetryConfig.ts` to include an optional `shouldRetry` predicate.
- Update `RetryingExecutionStrategy` in `src/strategies/RetryingExecutionStrategy.ts` to evaluate this predicate (if present) before deciding to retry.
- If `shouldRetry` returns `false`, the retry loop is broken immediately, and the failure result is returned.
- If `shouldRetry` is undefined, the existing behavior (retry on any failure) is preserved.

## Impact

- **Affected specs**: `001-generic-task-runner` (or simply `task-runner`)
- **Affected code**: `src/contracts/TaskRetryConfig.ts`, `src/strategies/RetryingExecutionStrategy.ts`
- **Non-breaking change**: The `shouldRetry` property is optional. Existing retry configurations will continue to work as before.
