# Propose Plugin System

## Summary
Introduce a plugin system to the `task-runner` that allows external modules to alter behavior, listen to events, and interact with the execution context via a defined API.

## Motivation
Currently, extending the `task-runner` requires modifying the core codebase. To enable a more collaborative and decentralized development model, we need a way for developers to inject custom logic, middleware, or event listeners without touching the core.

## Scope
- Define a strict `Plugin` interface.
- Implement a `PluginManager` to handle plugin lifecycle (registration, initialization).
- Expose an `EventBus` and `PluginContext` to plugins.
- Ensure plugins can intercept or react to workflow lifecycle events (`workflowStart`, `taskStart`, etc.).
