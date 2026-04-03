## Context

Currently, the task runner always re-executes tasks, even if inputs (context) have not changed. This is inefficient for workflows with expensive steps like builds or data processing.

## Goals / Non-Goals

- **Goals**:
    - Avoid redundant execution of expensive tasks.
    - Support pluggable caching mechanisms (defaulting to in-memory).
    - Allow restoration of context side effects when skipping execution.
- **Non-Goals**:
    - Distributed caching (out of scope for now).
    - Automatic dependency hashing (cache key must be provided by the user).
    - Persistent file system caching (can be added later via plugin or custom provider).

## Decisions

- **Decision**: Use `ICacheProvider` interface.
    - **Rationale**: Allows users to swap the caching backend (e.g., Redis, FS) without changing core logic.
- **Decision**: Explicit `restore` callback.
    - **Rationale**: Since context is mutable and side-effect driven, simply returning a cached result is insufficient. The task must explicitly define how to re-apply its changes to the context based on the cached result.
- **Decision**: Wrap execution strategy.
    - **Rationale**: Follows the existing decorator pattern (like `RetryingExecutionStrategy`), keeping concerns separated.

## Risks / Trade-offs

- **Risk**: Stale cache data if keys are not unique enough.
    - **Mitigation**: Documentation must emphasize the importance of including all relevant inputs in the cache key.
- **Risk**: Context inconsistency if `restore` is implemented incorrectly.
    - **Mitigation**: Provide clear examples and potentially validate context changes in debug mode.

## Migration Plan

- This is an additive change. Existing tasks without `cache` config will work as before. No migration required.
