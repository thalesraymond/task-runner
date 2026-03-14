# Change: Add Matrix Execution Support

## Why

Task orchestration tools in the industry (such as Nx, GitHub Actions, GitLab CI, and Turborepo) commonly support Matrix Execution. This allows a single task definition to run multiple times automatically across a set of variable combinations. In `task-runner`, defining identical tasks to process multiple permutations manually increases boilerplate and violates the DRY (Don't Repeat Yourself) principle. Introducing `matrix` configurations directly on the `TaskStep` allows developers to run a task concurrently across different configurations (e.g., Node.js versions, OS platforms, target environments) efficiently.

## What Changes

- Introduce a `matrix` property to the `TaskStep` configuration.
- The `matrix` property should support defining variables as an object of arrays (e.g., `matrix: { node: [18, 20], os: ['ubuntu', 'windows'] }`).
- The engine will dynamically generate and execute independent child tasks for each permutation of the matrix.
- Ensure the `MermaidGraph` utility correctly visualizes these dynamic nodes.
- Expose the current permutation variables to the execution context of each child task.

## Impact

- Affected specs: `task-runner` (Task Configuration, Core Orchestration)
- Affected code:
  - `src/core/TaskStep.ts`
  - `src/core/TaskRunner.ts`
  - `src/core/TaskGraph.ts`
  - `src/core/TaskStateManager.ts`
  - `src/core/WorkflowExecutor.ts`
