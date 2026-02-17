## 1. Core Interfaces

- [ ] 1.1 Define `TaskCacheConfig` interface in `src/contracts/TaskCacheConfig.ts` with `inputs` (files, globs), `env` (vars), and `outputs` (files, dirs).
- [ ] 1.2 Update `TaskStep` interface in `src/TaskStep.ts` to include optional `cache: TaskCacheConfig`.
- [ ] 1.3 Define `ICacheStorage` interface for cache backends (get/set/has).

## 2. Hashing and Storage

- [ ] 2.1 Implement `FileHasher` utility to compute SHA-256 hashes of file contents and globs.
- [ ] 2.2 Implement `LocalCacheStorage` that stores artifacts in `.task-runner/cache` (configurable).
- [ ] 2.3 Implement logic to tar/zip output directories for storage.

## 3. Execution Strategy

- [ ] 3.1 Implement `CachingExecutionStrategy` in `src/strategies/CachingExecutionStrategy.ts`.
- [ ] 3.2 Implement logic to compute cache key (Task Name + Input Hash + Env Hash).
- [ ] 3.3 Implement `execute` method: Check cache -> Restore if hit -> Run inner strategy if miss -> Cache result.

## 4. Integration

- [ ] 4.1 Add `useCache(storage)` method to `TaskRunnerBuilder`.
- [ ] 4.2 Add unit tests for `FileHasher` and `LocalCacheStorage`.
- [ ] 4.3 Add integration tests for `CachingExecutionStrategy` verifying cache hits and misses.
