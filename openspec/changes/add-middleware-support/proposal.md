# Change: Add Middleware Support

## Why

Developers currently duplicate code for cross-cutting concerns like logging, error handling policies, context validation, and metrics across every task definition. This leads to code duplication, inconsistent behavior, and maintenance burden. There is no standard way to inject logic "around" task execution globally.

## What Changes

- **Middleware Interface**: Introduce a `Middleware<T>` type representing a function that wraps task execution.
- **TaskRunnerBuilder**: Add a `.use(middleware)` method to register middleware functions.
- **TaskRunner**:
    - Store the chain of middleware.
    - During execution, wrap the `Strategy.execute` call with the middleware chain (onion model).
    - Ensure middleware runs *before* the task starts and *after* it finishes (or fails).

## Impact

- Affected specs: `task-runner`
- Affected code: `TaskRunner.ts`, `TaskRunnerBuilder.ts`, `WorkflowExecutor.ts`, `contracts/Middleware.ts`
