# Change: Add Workflow Preview

## Why

It can be difficult to understand the execution flow of complex dependency graphs just by looking at the code. Users also currently cannot easily verify the execution plan without running the side effects, which carries risk.

## What Changes

- Add a `DryRunExecutionStrategy` which implements `IExecutionStrategy`. This allows `WorkflowExecutor` to simulate execution without side effects.
- Add a standalone utility `generateMermaidGraph(steps: TaskStep[])` to generate a Mermaid.js diagram of the dependency graph.
- Expose these features via the main `TaskRunner` facade if applicable, or as separate utilities.

## Impact

- **New Components**: `DryRunExecutionStrategy`, `generateMermaidGraph`
- **Affected Components**: `WorkflowExecutor` (indirectly, via strategy injection)
