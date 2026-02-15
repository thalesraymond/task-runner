# Allow Plugin hooks

## Summary
Introduce pre-task and post-task hooks to the Plugin System, allowing plugins to intercept task execution, modify behavior, or transform results.

## Motivation
Current plugins are limited to "observation" via read-only events. To enable advanced use cases like caching, validation, or policy enforcement, plugins need to be able to intervene in the execution flow.

## Scope
-   **Pre-Task Hooks**: Runs before a task. Can skip, fail, or modify task/context.
-   **Post-Task Hooks**: Runs after a task. Can modify the result.
-   **Hook Registration**: Add `registerPreHook` and `registerPostHook` to `PluginContext`.
