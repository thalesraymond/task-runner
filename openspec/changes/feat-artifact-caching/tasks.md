# Engineering Tasks

- [ ] **Task 1: Define Caching Interface**
  - Create `src/contracts/TaskCacheConfig.ts`.
  - Define `TaskCacheConfig`:
    ```typescript
    export interface TaskCacheConfig {
      inputs?: {
        files?: string[]; // Glob patterns
        env?: string[]; // Env var names
      };
      outputs?: string[]; // File/Directory paths
    }
    ```
  - Update `src/TaskStep.ts` to include `cache?: TaskCacheConfig;`.
  - Update `src/TaskResult.ts` to include optional `cached?: boolean;`.

- [ ] **Task 2: Implement Cache Manager**
  - Create `src/caching/CacheManager.ts`.
  - Implement `calculateHash(inputs: TaskCacheConfig['inputs']): Promise<string>`.
    - Use `glob` to find files.
    - Read file contents and env vars.
    - Generate SHA-256 hash.
  - Implement `store(hash: string, outputs: string[]): Promise<void>`.
    - Copy files from workspace to `.cache/task-runner/{hash}/`.
  - Implement `restore(hash: string, outputs: string[]): Promise<boolean>`.
    - Check if `.cache/task-runner/{hash}/` exists.
    - Copy files back to workspace.
    - Return `true` if restored, `false` otherwise.
  - Handle errors (e.g., missing files) gracefully.

- [ ] **Task 3: Implement Caching Execution Strategy**
  - Create `src/strategies/CachingExecutionStrategy.ts`.
  - Class should implement `IExecutionStrategy`.
  - Constructor accepts an inner strategy (e.g., `StandardExecutionStrategy`) and an optional `CacheManager` (or creates one).
  - In `execute(step, context, signal)`:
    - 1. Check if `step.cache` is defined. If not, delegate to inner strategy.
    - 2. Calculate input hash using `CacheManager`.
    - 3. Check cache: `cacheManager.restore(hash, step.cache.outputs)`.
    - 4. If restored:
      - Return `{ status: 'success', cached: true }`.
    - 5. If not restored (miss):
      - Delegate to inner strategy: `result = await this.inner.execute(...)`.
      - If `result.status === 'success'`:
        - `await cacheManager.store(hash, step.cache.outputs)`.
      - Return result.

- [ ] **Task 4: Update Task Runner Builder**
  - Update `src/TaskRunnerBuilder.ts`.
  - Add method `.enableCaching(options?: { cacheDir?: string })`.
  - Update `.build()` to wrap the strategy with `CachingExecutionStrategy` if enabled.
  - (Alternatively, expose `CachingExecutionStrategy` for manual composition).

- [ ] **Task 5: Unit Tests**
  - Create `tests/caching/CacheManager.test.ts`.
    - Test hashing consistency (same inputs = same hash).
    - Test hashing changes (file change = different hash).
    - Test store/restore mechanism (mock file system or use temp dirs).
  - Create `tests/strategies/CachingExecutionStrategy.test.ts`.
    - Mock `CacheManager` and inner strategy.
    - Test cache hit (restore called, inner not called).
    - Test cache miss (inner called, store called on success).
    - Test cache miss + failure (store NOT called).

- [ ] **Task 6: Integration Test**
  - Create `tests/integration/artifact-caching.test.ts`.
  - Create a temp directory with a source file.
  - Define a task that reads source, writes output.
  - Run runner (Run 1): Verify output created, cache created.
  - Run runner (Run 2): Verify task skipped (metrics duration low), output exists (restored/touched).
  - Modify source file.
  - Run runner (Run 3): Verify task runs again (new hash).
