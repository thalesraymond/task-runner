## Implementation

- [x] 1.1 Update `TaskRunnerExecutionConfig` to include an optional `dryRun: boolean` property.
- [x] 1.2 Implement `dryRun` logic in `WorkflowExecutor` (traverse graph, validate order, skip `step.run()`, return `skipped` or `success` pseudo-status).
- [x] 1.3 Implement `getMermaidGraph(steps: TaskStep[])` method (can be static or instance method on `TaskRunner`).
- [x] 1.4 Ensure `dryRun` respects other configs like `concurrency` (if applicable) to simulate actual timing/order if possible, or just strict topological order.
- [x] 1.5 Add unit tests for `dryRun` ensuring no side effects occur.
- [x] 1.6 Add unit tests for `getMermaidGraph` output correctness (nodes and edges).
