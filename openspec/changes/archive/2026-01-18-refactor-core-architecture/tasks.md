## Implementation
- [x] 1.1 Extract `TaskStateManager` to handle `TaskResult` storage, updates, and context mutations.
- [x] 1.2 Define `IExecutionStrategy` interface for running tasks (Strategy Pattern).
- [x] 1.3 Refactor `WorkflowExecutor` to use `TaskStateManager` and `IExecutionStrategy`.
- [x] 1.4 Move explicit event emission out of the core loop into the `TaskStateManager` or a dedicated `ExecutionObserver`.
- [x] 1.5 Create a factory or builder for `TaskRunner` to simplify configuration for developers.
- [x] 1.6 Verify that all existing tests pass with the new structure.
- [x] 1.7 Add "Quality of Life" improvements (e.g., better error messages with specific task context).
