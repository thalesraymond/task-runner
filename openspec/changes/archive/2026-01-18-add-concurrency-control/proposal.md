# Change: Add Concurrency Control

## Why
The current implementation executes *all* independent tasks in parallel. In large graphs with many independent nodes, this could overwhelm system resources (CPU, memory) or trigger external API rate limits.

## What Changes
- Add `concurrency: number` optional property to `WorkflowExecutor`.
- Modify `WorkflowExecutor.processLoop` to respect the concurrency limit.
    - Track the active promise count.
    - Only start new tasks from the ready queue if `active < concurrency`.
    - Continue to defer ready tasks until slots open up.

## Impact
- **Affected Components**: `WorkflowExecutor`
