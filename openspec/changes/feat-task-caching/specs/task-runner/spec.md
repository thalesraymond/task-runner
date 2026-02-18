## ADDED Requirements

### Requirement: Task Output Caching

The system SHALL support caching task results based on a user-defined key to avoid redundant execution of expensive tasks.

#### Scenario: Cache Hit

- **WHEN** a task defines a `cache` configuration with a `key` generator
- **AND** a valid cache entry exists for the generated key
- **THEN** the task execution logic (the `run` method) is skipped
- **AND** the cached `TaskResult` is returned immediately

#### Scenario: Cache Miss

- **WHEN** a task defines a `cache` configuration
- **AND** no valid cache entry exists for the generated key
- **THEN** the task execution logic runs normally
- **AND** the resulting `TaskResult` is stored in the cache provider associated with the key

#### Scenario: Context Restoration

- **WHEN** a task is skipped due to a cache hit
- **AND** the task defines a `restore` callback in its `cache` configuration
- **THEN** the `restore` callback is executed with the current context and the cached result
- **AND** the context is updated according to the callback logic

#### Scenario: Cache Expiration

- **WHEN** a task defines a `ttl` in its `cache` configuration
- **AND** the cache entry is older than the `ttl`
- **THEN** the cache entry is treated as missing (Cache Miss scenario applies)
