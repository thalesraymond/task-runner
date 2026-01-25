# Change: Add Composite Task Support

## Why

As workflows grow in complexity, flat lists of tasks become difficult to manage and visualize. Developers need a way to group related tasks into reusable, logical units (Composite Tasks) to encapsulate logic, share context, and simplify the top-level workflow graph.

## What Changes

- Introduce a new `CompositeTaskStep` interface that extends `TaskStep` and allows defining a list of child steps.
- Update `TaskRunner` execution logic to handle `CompositeTaskStep` by recursively executing its child steps.
- Update `TaskGraphValidator` to validate the internal structure of composite tasks.
- Update `TaskRunner.getMermaidGraph` to render composite tasks as subgraphs.

## Impact

- **Affected specs:** `task-runner`
- **Affected code:** `src/TaskStep.ts`, `src/TaskRunner.ts`, `src/WorkflowExecutor.ts`, `src/TaskGraphValidator.ts`
