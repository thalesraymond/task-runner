# Plugin System Design

## Architecture

The plugin system will resolve around a `PluginManager` that is owned by the `TaskRunner`.

### Plugin Interface

A plugin is defined as:

```typescript
export interface Plugin<TContext> {
  name: string;
  version: string;
  install(context: PluginContext<TContext>): void | Promise<void>;
}
```

### Plugin Context

The `install` method receives a `PluginContext`, which exposes capabilities to the plugin:

```typescript
export interface PluginContext<TContext> {
  events: EventBus<TContext>; // Access to listen/emit events
  // Potentially other APIs in the future, e.g., registerTask, logger, etc.
}
```

### Lifecycle

1. **Registration**: Plugins are registered via `taskRunner.use(plugin)`.
2. **Installation**: When `taskRunner.execute()` is called (or explicitly before), the `PluginManager` iterates over registered plugins and calls `install()`.
3. **Execution**: Plugins listen to events or hooks during execution.

### Error Handling

- Implementation should handle plugin failures during `install` gracefully (fail fast or log and continue, defined by config).
- Runtime errors in listeners should be caught to avoid crashing the runner, though `EventBus` current implementation might need review.

## Components

- `src/contracts/Plugin.ts`: Interface definition.
- `src/PluginManager.ts`: Manages the list of plugins and their initialization.
- `src/TaskRunner.ts`: Modified to include `use()` method and delegate to `PluginManager`.
