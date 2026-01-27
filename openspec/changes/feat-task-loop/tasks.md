## 1. Implementation

- [ ] 1.1 Define `TaskLoopConfig` interface in `contracts/TaskLoopConfig.ts`.
- [ ] 1.2 Update `TaskStep` interface to include optional `loop` property.
- [ ] 1.3 Implement `LoopingExecutionStrategy` in `strategies/LoopingExecutionStrategy.ts`.
- [ ] 1.4 Update `TaskRunnerBuilder` to include `LoopingExecutionStrategy` in the default chain (wrapping `RetryingExecutionStrategy`).
- [ ] 1.5 Add unit tests for `LoopingExecutionStrategy` in `tests/strategies/LoopingExecutionStrategy.test.ts`.
- [ ] 1.6 Add integration tests for looped tasks in `tests/TaskRunnerLoop.test.ts`.
