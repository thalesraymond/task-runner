## 1. Implementation

- [ ] 1.1 Define `ICacheProvider` interface in `src/cache/ICacheProvider.ts`.
- [ ] 1.2 Implement `MemoryCacheProvider` in `src/cache/MemoryCacheProvider.ts`.
- [ ] 1.3 Add `cache` property to `TaskStep` interface in `src/TaskStep.ts`.
- [ ] 1.4 Implement `CachingExecutionStrategy` in `src/strategies/CachingExecutionStrategy.ts`.
- [ ] 1.5 Update `TaskRunnerBuilder` in `src/TaskRunnerBuilder.ts` to support `.useCache()`.
- [ ] 1.6 Add unit tests for `MemoryCacheProvider` in `tests/cache/MemoryCacheProvider.test.ts`.
- [ ] 1.7 Add unit tests for `CachingExecutionStrategy` in `tests/strategies/CachingExecutionStrategy.test.ts`.
- [ ] 1.8 Add integration tests for caching and context restoration in `tests/TaskRunnerCaching.test.ts`.
