## Implementation
- [ ] 1.1 Update `TaskRunnerExecutionConfig` to include an optional `dryRun: boolean` property.
- [ ] 1.2 Implement `dryRun` logic in `WorkflowExecutor` (traverse graph, validate order, skip `step.run()`, return `skipped` or `success` pseudo-status).
- [ ] 1.3 Implement `getMermaidGraph(steps: TaskStep[])` method (can be static or instance method on `TaskRunner`).
- [ ] 1.4 Ensure `dryRun` respects other configs like `concurrency` (if applicable) to simulate actual timing/order if possible, or just strict topological order.
- [ ] 1.5 Add unit tests for `dryRun` ensuring no side effects occur.
- [ ] 1.6 Add unit tests for `getMermaidGraph` output correctness (nodes and edges).
