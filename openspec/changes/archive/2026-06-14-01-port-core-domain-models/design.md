## Context

The foundation of the task runner involves executing discrete units of work called "Tasks" that manipulate or read from a shared context. In the original TypeScript version, this was modeled using generic interfaces (`TaskStep<T>`) and JS features like `AbortSignal`. To properly port this to Go, we need to design idiomatic equivalents that provide compile-time type safety for the shared context and utilize Go's built-in cancellation primitives.

## Goals / Non-Goals

**Goals:**
- Design a generic `Task[T any]` interface in Go.
- Define a structured `TaskResult` and `TaskStatus` enumeration.
- Use `context.Context` for execution cancellation and timeouts.

**Non-Goals:**
- Implementing the engine (WorkflowExecutor) that actually runs these tasks.
- Designing the state manager.

## Decisions

- **Generics for Shared State**: We will use Go 1.18+ type parameters (`type Task[T any] interface`) to type the shared state cleanly without resorting to `interface{}`/`any` assertions at runtime.
- **context.Context**: Instead of implementing a custom abort controller, the `Run` method signature will accept `ctx context.Context`. This allows native integrations with Go's standard library and ecosystem out of the box.
- **TaskStatus Enum**: We will define a custom type `type TaskStatus int` and define `iota` constants (`StatusSuccess`, `StatusFailure`, `StatusSkipped`, `StatusCancelled`) to avoid raw strings and typos.
- **TaskResult Struct**: `TaskResult` will be a struct containing the `TaskStatus`, an optional `error`, and possibly metadata or duration, mirroring the TypeScript implementation but returning idiomatic Go errors.

## Risks / Trade-offs

- [Risk] Go's Generics can sometimes complicate method signatures on implementations if not used carefully. → Mitigation: Keep the generics isolated to the `Task[T]` interface and the top-level generic workflow struct.
