## Why

To prevent runtime deadlocks and ensure predictable execution, the Go task runner must validate the task graph before execution. We need to port the `TaskGraphValidator` to check for cycles, missing dependencies, and duplicate IDs using idiomatic Go error types, as well as port the Mermaid graph generation utility.

## What Changes

- Implement a graph validator that identifies structural issues (cycles, missing dependencies, duplicate task IDs).
- Define custom, idiomatic Go error types (e.g., `CycleError`, `MissingDependencyError`) allowing programmatic inspection via `errors.As`.
- Port the Mermaid graph generation utility, utilizing Go's `strings` and `regexp` packages for proper node ID sanitization.

## Capabilities

### New Capabilities
- `graph-utilities`: Encompasses both the task graph validation logic and the Mermaid graph generation utility.

### Modified Capabilities

## Impact

- **Code:** New Go packages/files for validation and Mermaid generation.
- **APIs:** The task execution entry point will now return these specific error types if validation fails before any tasks are run.
