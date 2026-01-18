## Implementation
- [x] 1.1 Update `TaskRunner.execute` signature to accept an optional config object.
- [x] 1.2 Implement logic within `TaskRunner` to listen for `AbortSignal` and initiate cancellation.
- [x] 1.3 Implement global timeout mechanism using `AbortController` and `setTimeout`.
- [x] 1.4 Propagate `AbortSignal` to individual `TaskStep` executions.
- [x] 1.5 Ensure `TaskRunner` correctly handles tasks that are already aborted before execution.
- [x] 1.6 Update `TaskResult` and `RunnerEvents` to reflect cancellation status.
- [x] 1.7 Add unit tests for `AbortSignal` cancellation scenarios.
- [x] 1.8 Add unit tests for global timeout scenarios.
- [x] 1.9 Add integration tests covering both `AbortSignal` and timeout interactions.