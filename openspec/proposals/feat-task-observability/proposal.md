# Change: Workflow Observability and Logging Enhancements

## Why

As workflows scale in complexity and run in diverse environments (CI/CD, containerized workers, local development), tracking their execution becomes difficult. Currently, users have to manually hook into the `EventBus` to build their own loggers or metrics exporters. Providing built-in, standardized observability tools (like a structured logger or CLI output formatter) will significantly improve the Developer Experience (DX) and reduce boilerplate for debugging complex task graphs.

## What Changes

- Introduce a standardized `LoggerPlugin` (or similar logging abstraction) that hooks into the existing `EventBus`.
- Support multiple output formats: `text` (human-readable for CLI) and `json` (structured logging for ingestion by tools like Datadog, ELK, CloudWatch).
- Capture and format key metrics automatically: task duration, error stack traces, and workflow summaries.

## Impact

- Affected specs: `task-runner` (adding observability capabilities)
- Affected code: `src/plugins/LoggerPlugin.ts` (new), `TaskRunnerBuilder` (optional `.withLogger()` integration).
