# Plugin Hooks Design

## Architecture

We will extend the `PluginManager` to manage a list of hooks. The `WorkflowExecutor` will call these hooks at appropriate times.

### Hook Interfaces

```typescript
export type PreTaskHookResult<TContext> =
  | { action: "continue" }
  | { action: "skip"; message?: string }
  | { action: "fail"; error: Error };

export type PreTaskHook<TContext> = (
  step: TaskStep<TContext>,
  context: TContext
) => Promise<PreTaskHookResult<TContext> | void> | void; // void implies continue

export type PostTaskHook<TContext> = (
  step: TaskStep<TContext>,
  context: TContext,
  result: TaskResult
) => Promise<TaskResult | void> | void; // void implies return original result
```

### PluginContext Extension

```typescript
export interface PluginContext<TContext> {
    events: EventBus<TContext>;
    preTask(hook: PreTaskHook<TContext>): void;
    postTask(hook: PostTaskHook<TContext>): void;
}
```

### Execution Flow

**In `WorkflowExecutor.executeTaskStep`:**

1.  **Run Pre-Hooks (Sequential)**
    -   Iterate through registered pre-hooks.
    -   If any returns `skip`, mark task skipped and return.
    -   If any returns `fail`, mark task failed and return.
    -   (Future: allow modifying context contextually? Context is mutable so yes).

2.  **Execute Task** (Original logic)

3.  **Run Post-Hooks (Sequential)**
    -   Pass the result to hooks.
    -   Hooks can return a new `TaskResult` to overwrite the current one.
