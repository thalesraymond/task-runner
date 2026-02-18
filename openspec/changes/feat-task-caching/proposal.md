# Change: Add Task Output Caching

## Why

Users often run workflows with tasks that perform expensive operations (e.g., API calls, heavy computations, data processing). Re-running these tasks when inputs haven't changed is wasteful and slows down the development cycle. Currently, there is no mechanism to cache task results and skip execution based on inputs.

## What Changes

- Update `TaskStep` interface to include an optional `cache` configuration:
  - `key: (ctx: TContext) => string`: A function to generate a unique cache key based on the context (inputs).
  - `ttl?: number`: Time-to-live for the cache entry in milliseconds.
  - `restore?: (ctx: TContext, result: TaskResult) => void`: A callback to update the context from the cached result (since the task won't run to produce side effects).
- Implement `CachingExecutionStrategy` which wraps another strategy. It checks the cache before execution and stores the result after execution.
- Introduce `ICacheProvider` interface with `get` and `set` methods, and a default `MemoryCacheProvider`.
- Update `TaskRunnerBuilder` to allow configuring the cache provider via `.useCache(provider)`.

## Impact

- **Affected Specs**: `task-runner`
- **Affected Code**:
  - `src/TaskStep.ts`: Update interface.
  - `src/strategies/CachingExecutionStrategy.ts`: New file.
  - `src/cache/ICacheProvider.ts`: New file.
  - `src/cache/MemoryCacheProvider.ts`: New file.
  - `src/TaskRunnerBuilder.ts`: Integrate cache provider configuration.
