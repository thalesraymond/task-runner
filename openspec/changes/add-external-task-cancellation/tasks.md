## Implementation
- [ ] 1.1 Update `TaskRunner.execute` signature to accept an optional config object.
- [ ] 1.2 Implement logic within `TaskRunner` to listen for `AbortSignal` and initiate cancellation.
- [ ] 1.3 Implement global timeout mechanism using `AbortController` and `setTimeout`.
- [ ] 1.4 Propagate `AbortSignal` to individual `TaskStep` executions.
- [ ] 1.5 Ensure `TaskRunner` correctly handles tasks that are already aborted before execution.
- [ ] 1.6 Update `TaskResult` and `RunnerEvents` to reflect cancellation status.
- [ ] 1.7 Add unit tests for `AbortSignal` cancellation scenarios.
- [ ] 1.8 Add unit tests for global timeout scenarios.
- [ ] 1.9 Add integration tests covering both `AbortSignal` and timeout interactions.