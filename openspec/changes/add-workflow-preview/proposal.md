# Change: Add Workflow Preview

## Why
It can be difficult to understand the execution flow of complex dependency graphs just by looking at the code. Users also currently cannot easily verify the execution plan without running the side effects, which carries risk.

## What Changes
- Add a `dryRun` execution mode to `TaskRunner`.
- Add a helper method `getMermaidGraph(steps)` to generate a Mermaid.js diagram of the dependency graph.

## Impact
- Affected specs: `task-runner`
- Affected code: `src/TaskRunner.ts`, `src/TaskRunnerExecutionConfig.ts`
