## 1. Implementation

- [ ] 1.1 Define `TaskLoopConfig` interface in `src/contracts/TaskLoopConfig.ts`.
- [ ] 1.2 Update `TaskStep` interface in `src/TaskStep.ts` to include optional `loop: TaskLoopConfig`.
- [ ] 1.3 Implement `LoopingExecutionStrategy` in `src/strategies/LoopingExecutionStrategy.ts`.
- [ ] 1.4 Update `TaskRunnerBuilder` in `src/TaskRunnerBuilder.ts` to include `LoopingExecutionStrategy`.
- [ ] 1.5 Add unit tests for `LoopingExecutionStrategy`.
- [ ] 1.6 Verify integration with `RetryingExecutionStrategy` (looping should happen outside retries).
