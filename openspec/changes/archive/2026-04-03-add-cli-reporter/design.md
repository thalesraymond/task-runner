## Context

Task orchestration pipelines run asynchronously in parallel. A user initiating the script from the command-line often only receives final JSON objects or verbose scattered logs. An interactive CLI Reporter Plugin provides structured visibility on which task is running, pending, succeeded, or failed.

## Goals / Non-Goals

- Goals:
  - Provide real-time task progress via the existing Plugin and EventBus API.
  - Summarize pipeline results natively on completion.
  - Zero external dependencies where possible, relying on simple ANSI rendering or minimal libraries native to Node environments.
- Non-Goals:
  - Complete restructuring of the EventBus system.
  - Persisting logs to external logging providers.

## Decisions

- Decision: Build a `CLIReporterPlugin` that listens to `TaskRunner` lifecycle events via the `EventBus` rather than altering the core execution loop.
- Alternatives considered: Updating `WorkflowExecutor` to print logs directly. This was rejected because the `TaskRunner` is domain-agnostic, and core logs should remain decoupled from external execution. Pluggable reporters follow standard orchestration practices.

## Risks / Trade-offs

- Overlapping CLI outputs when user scripts manually print using `console.log()`.
  - Mitigation: Inform users in documentation to intercept and pipe raw logs or suggest a unified logger.

## Migration Plan

- The plugin will be entirely additive. Users who wish to adopt the `CLIReporterPlugin` will simply add it via `runner.use(new CLIReporterPlugin())`.
