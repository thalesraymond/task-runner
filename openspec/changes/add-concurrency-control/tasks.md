## Implementation
- [ ] 1.1 Update `TaskRunnerExecutionConfig` to include an optional `concurrency` property.
- [ ] 1.2 Update `WorkflowExecutor` to accept the `concurrency` limit.
- [ ] 1.3 Implement a task queueing mechanism in `WorkflowExecutor` to manage pending tasks.
- [ ] 1.4 Update execution logic to check available concurrency slots before starting a task.
- [ ] 1.5 Ensure task completion triggers the execution of queued tasks.
- [ ] 1.6 Verify that unlimited concurrency (default behavior) is preserved when no limit is set.
- [ ] 1.7 Add unit tests for concurrency limits (e.g., ensure no more than N tasks run at once).
- [ ] 1.8 Add integration tests with mixed dependencies and concurrency limits.
