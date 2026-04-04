## 1. Implementation

- [ ] 1.1 Update `TaskStep` interface in `src/TaskStep.ts` to include an optional `matrix` configuration, which maps keys to arrays of values (e.g., `Record<string, unknown[]>`).
- [ ] 1.2 Modify `TaskRunner.ts` or `WorkflowExecutor.ts` to implement a "matrix expansion" phase before executing tasks, transforming a single `TaskStep` with a matrix into multiple individual `TaskStep` objects.
- [ ] 1.3 Ensure the dynamically generated matrix sub-tasks have unique names (e.g., appending stringified parameters to the original name).
- [ ] 1.4 Update the task's execution logic to pass the specific permutation parameters to the task's `run` context.
- [ ] 1.5 Update `TaskGraphValidator.ts` to ensure it correctly resolves dependencies involving matrix tasks, including dynamically generated names.
- [ ] 1.6 Add comprehensive unit tests verifying that matrix expansion works correctly, generates the correct number of combinations, and correctly injects parameters.
- [ ] 1.7 Add integration tests verifying complex graphs that mix matrix tasks with regular tasks and dependencies.
- [ ] 1.8 Update documentation/README.md to demonstrate the usage of the new `matrix` feature.
