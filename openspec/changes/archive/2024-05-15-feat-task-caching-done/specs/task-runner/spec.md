## ADDED Requirements

### Requirement: Task Caching Configuration

The `TaskStep` interface SHALL support an optional `cache` property of type `TaskCacheConfig`.

#### Scenario: Cache Config Structure

- **GIVEN** a `TaskCacheConfig` object
- **THEN** it SHALL support:
  - `key`: A function returning a unique string key based on the context.
  - `ttl`: Optional time-to-live in milliseconds.
  - `restore`: Optional function to restore context side effects from a cached result.

### Requirement: Caching Execution Strategy

The system SHALL provide a `CachingExecutionStrategy` that implements `IExecutionStrategy` and wraps another `IExecutionStrategy`.

#### Scenario: Cache Miss Execution

- **WHEN** the `CachingExecutionStrategy` executes a task with a cache key that is NOT present in the cache provider
- **THEN** it SHALL execute the task using the inner strategy.
- **AND** it SHALL store the result in the cache provider if execution is successful.
- **AND** it SHALL return the result.

#### Scenario: Cache Hit Execution

- **WHEN** the `CachingExecutionStrategy` executes a task with a cache key that IS present in the cache provider
- **THEN** it SHALL NOT execute the inner strategy.
- **AND** it SHALL invoke the `restore` function (if provided) with the current context and the cached result.
- **AND** it SHALL return the cached result.

#### Scenario: Cache Expiration

- **WHEN** a cached item's TTL has expired
- **THEN** the cache provider SHALL NOT return the item.
- **AND** the strategy SHALL proceed as a cache miss.

### Requirement: Cache Provider Interface

The system SHALL define an `ICacheProvider` interface for pluggable caching backends.

#### Scenario: Interface Methods

- **GIVEN** an `ICacheProvider` implementation
- **THEN** it SHALL support:
  - `get(key: string): Promise<TaskResult | undefined>`
  - `set(key: string, value: TaskResult, ttl?: number): Promise<void>`
  - `delete(key: string): Promise<void>`

### Requirement: Default Memory Cache

The system SHALL provide a `MemoryCacheProvider` as the default implementation of `ICacheProvider`.

#### Scenario: In-Memory Storage

- **WHEN** items are set in `MemoryCacheProvider`
- **THEN** they are stored in memory and retrieved correctly until process termination or expiration.
