## 1. Implementation

- [ ] 1.1 Update `TaskStep` interface in `src/TaskStep.ts` to include an optional `tags?: string[]` property.
- [ ] 1.2 Define a new type or interface `TaskFilterConfig` in `src/contracts/TaskFilterConfig.ts` with optional properties for `includeTags`, `excludeTags`, `includeNames`, `excludeNames`, and `includeDependencies`.
- [ ] 1.3 Create a utility module `src/utils/TaskFilter.ts`.
    - Implement a pure function `filterTasks(steps: TaskStep<any>[], config: TaskFilterConfig): TaskStep<any>[]`.
    - Ensure filtering handles both names and tags.
- [ ] 1.4 Handle Dependencies during filtering. Implement a configurable flag in `TaskFilterConfig` (e.g., `includeDependencies?: boolean`).
    - If `true`, recursively include all tasks that the explicitly selected tasks depend on.
- [ ] 1.5 Update `TaskRunnerExecutionConfig` in `src/TaskRunnerExecutionConfig.ts` to optionally accept a `filter` of type `TaskFilterConfig`.
- [ ] 1.6 Update `TaskRunner.ts` in the `execute` method to apply `filterTasks` to the input steps if `config.filter` is provided, *before* passing the subset to `WorkflowExecutor`.
- [ ] 1.7 Write unit tests for `TaskFilter.ts` ensuring inclusion, exclusion, and dependency resolution work correctly.
- [ ] 1.8 Write integration tests for `TaskRunner` filtering in `tests/TaskRunnerFiltering.test.ts` to verify end-to-end filtering execution.
