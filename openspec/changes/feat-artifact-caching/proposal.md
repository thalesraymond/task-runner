# Change: Artifact Caching

## Why

In many workflows (build systems, data pipelines, CI/CD), tasks often produce the same output for the same input. Re-running these expensive tasks (e.g., compiling code, training models) is wasteful and slows down the feedback loop. Caching task outputs based on input hashes can significantly improve performance by skipping redundant executions.

## What Changes

- **TaskStep Configuration**: Add a `cache` property to `TaskStep` to define inputs (files, env vars) and outputs (files, directories) to be cached.
- **Caching Strategy**: Introduce a `CachingExecutionStrategy` that wraps other strategies. It checks for a cache hit before execution and restores outputs if found. If not found, it executes the task and caches the outputs.
- **Cache Storage**: Implement a default `LocalCacheStorage` to store artifacts on the local file system.

## Impact

- **Affected Specs**: `artifact-caching`
- **Affected Code**: `src/TaskStep.ts`, `src/strategies/CachingExecutionStrategy.ts`, `src/cache/`
