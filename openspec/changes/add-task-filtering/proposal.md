# Change: Add Task Filtering and Tags

## Why

In complex orchestration pipelines, users often want to run only a subset of tasks—for instance, running only `lint` or `test` tasks without executing build steps, or isolating tasks related to a specific domain (e.g., `frontend` vs `backend`). Currently, the task runner requires users to manually curate and pass the exact list of tasks. Implementing a tagging and filtering system will significantly improve DX by allowing developers and CI pipelines to dynamically select tasks to run based on tags or names.

## What Changes

- **Task Configuration**: Add an optional `tags?: string[]` array to the `TaskStep` interface.
- **Filtering Utility**: Introduce a `filterTasks` utility function (e.g., in `src/utils/filterTasks.ts`) that takes an array of tasks and a filter configuration (by names or tags) and returns the matching subset, ensuring that the necessary dependencies are correctly handled (e.g., warning or optionally keeping dependencies).
- **Execution Config**: Update `TaskRunnerExecutionConfig` or the core execution flow to natively support filtering arguments.

## Impact

- **Affected specs**: `task-runner`
- **Affected code**: `src/TaskStep.ts`, `src/utils/filterTasks.ts` (new), `src/TaskRunner.ts`.
- **UX/DX**: Dramatically simpler workflow execution for large codebases and mono-repos where selective execution is standard (similar to Nx or Turborepo).
