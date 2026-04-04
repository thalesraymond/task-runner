# Change: Matrix Task Execution

## Why

Modern workflows frequently require executing the same task logic across multiple variations of inputs or environments (e.g., building for multiple OS targets, testing against multiple Node versions). Currently, users must manually duplicate `TaskStep` configurations to achieve this, increasing boilerplate and maintenance overhead. By introducing Matrix Task Execution, the task runner can automatically generate and run parallel variations of a task based on a parameterized matrix, bringing it in line with industry standards like GitHub Actions and Nx.

## What Changes

- **Task Configuration**: Add an optional `matrix` property to the `TaskStep` interface, allowing users to define a set of parameters (arrays of values) that will multiply the task into multiple instances.
- **Workflow Executor**: Modify `TaskRunner` or `WorkflowExecutor` (and potentially `TaskGraphValidator`) to dynamically expand matrix steps into individual, parallel sub-tasks at runtime before execution.
- **Task Identity**: Extend task naming conventions or introduce run metadata to uniquely identify matrix sub-tasks (e.g., `TaskName[node=18,os=ubuntu]`).
- **Context Injection**: Ensure the parameters of the matrix permutation are injected into the task's context or arguments when `run` is called.

## Impact

- **Affected specs**: `task-runner`
- **Affected code**: `TaskStep.ts`, `TaskRunner.ts`, `WorkflowExecutor.ts`, and possibly `TaskGraphValidator.ts`.
- **Performance**: Will slightly increase graph validation and resolution times, but significantly boosts developer velocity and DRY configuration by abstracting fan-out patterns.
