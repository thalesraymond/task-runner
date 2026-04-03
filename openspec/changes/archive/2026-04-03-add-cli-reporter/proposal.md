# Change: Add CLI Reporter Plugin

## Why

Task orchestration engines are difficult to observe during execution when they produce large amounts of parallel, unstructured output. Developers currently lack a clean, interactive, and structured CLI display to track real-time task progress, visualize success/failure/skip states, and review summarized performance metrics natively. A dedicated CLI reporter improves DX significantly.

## What Changes

- Create a `CLIReporterPlugin` that implements the `Plugin` interface.
- Integrate the plugin with the existing `EventBus` to capture lifecycle events (`taskStart`, `taskEnd`, `taskSkipped`).
- Provide real-time rendering of task execution statuses using a spinner or interactive console output.
- Print a concluding execution summary showing final metrics (duration, success/failure counts).

## Impact

- Affected specs: `cli-reporter` (new capability)
- Affected code: New plugin implementation under `src/plugins/CLIReporterPlugin.ts` and related tests.
