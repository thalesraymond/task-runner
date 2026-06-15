## Context

The TypeScript implementation of the task runner relies on an `EventBus` and `PluginManager` utilizing untyped string-based events (e.g., `workflowStart`, `taskStart`). In Go, an untyped central bus lacks type safety and doesn't leverage Go's native concurrency primitives optimally. We need a system that allows plugins to safely hook into the runner lifecycle without blocking execution, while providing strong type guarantees and decoupling.

## Goals / Non-Goals

**Goals:**
- Provide a strongly typed, interface-based event listener system for plugins.
- Ensure event dispatching is non-blocking to the main task runner execution loop.
- Decouple the event definitions from the core runner logic, making it easy to add new lifecycle hooks.

**Non-Goals:**
- Distributed or cross-network event systems.
- Synchronous, blocking event handlers (plugins must not block core execution).

## Decisions

### 1. Interface-based Plugin System
Instead of a generic `On(eventName string, handler func())`, plugins will be structs that implement specific listener interfaces:
```go
type TaskStartListener interface {
    OnTaskStart(ctx context.Context, task Task)
}
```
The central `EventDispatcher` will accept plugins and type-assert them to see which interfaces they implement. 
**Rationale:** This provides compile-time safety for plugin developers and makes the supported events explicitly discoverable via interfaces.

### 2. Channel-based Async Dispatching
Events will be represented as structs and pushed to a buffered channel. A dedicated background goroutine will read from this channel and broadcast the event to all registered listeners that support the corresponding interface.
**Rationale:** Utilizing a buffered channel prevents the main execution thread from blocking when emitting telemetry. The background dispatcher ensures that events are delivered to listeners sequentially, preserving event order.

## Risks / Trade-offs

- **Risk: Event queue overflow or memory pressure** if events are emitted significantly faster than listeners can process them.
  - **Mitigation:** Use an appropriately sized buffered channel. For slow listeners, we can wrap their execution in a goroutine within the dispatcher, though we must carefully manage concurrency to avoid race conditions in the plugin's state.
- **Risk: Event ordering issues** with concurrent listener execution.
  - **Mitigation:** The primary dispatcher loop will process the channel sequentially. If a plugin needs strict ordering, it must implement its own synchronization, or the dispatcher can guarantee sequential delivery per plugin.
