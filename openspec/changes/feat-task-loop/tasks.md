## 1. Implementation

- [ ] 1.1 Define `TaskLoopConfig` interface in `src/contracts/TaskLoopConfig.ts`
- [ ] 1.2 Update `TaskStep` interface in `src/TaskStep.ts` to include `loop?: TaskLoopConfig`
- [ ] 1.3 Create `LoopingExecutionStrategy` in `src/strategies/LoopingExecutionStrategy.ts` implementing `IExecutionStrategy`
- [ ] 1.4 Update `TaskRunnerBuilder` (if necessary) or ensure strategy composition works
- [ ] 1.5 Add unit tests for `LoopingExecutionStrategy` in `tests/strategies/LoopingExecutionStrategy.test.ts`
- [ ] 1.6 Add integration test in `tests/TaskRunnerLoop.test.ts`
