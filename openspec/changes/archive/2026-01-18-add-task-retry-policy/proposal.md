# Change: Add Task Retry Policy

## Why

Tasks currently run once and fail immediately if they throw an error or return a failure status. Network glitches or transient issues can therefore cause an entire workflow to fail unnecessarily.

## What Changes

- Add `TaskRetryConfig` interface to define retry behavior (attempts, delay, backoff).
- Update `TaskStep` interface to include optional `retry: TaskRetryConfig`.
- Implement `RetryingExecutionStrategy` which decorates any `IExecutionStrategy`.
  - It catches failures from the inner strategy.
  - It checks the retry policy.
  - It waits and re-executes the step if applicable.

## Impact

- **New Components**: `RetryingExecutionStrategy`, `TaskRetryConfig`
- **Affected Components**: `TaskStep` (interface update)
