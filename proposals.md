# Go Task Runner: Development Proposals

This document outlines the epics and features required to port the TypeScript `task-runner` implementation to Go. The goal is to achieve feature parity while fully embracing idiomatic Go patterns, such as small interfaces, goroutines, channels, and the standard `context` package.

## Epic 1: Core Domain Models and Interfaces (The Foundation)

The first step in the conversion process is establishing the core building blocks of the task runner. In the TypeScript version, these are represented by heavily typed generic interfaces like `TaskStep` and `TaskResult`. In Go, we will leverage Go 1.18+ Generics to maintain the type safety of the shared state (`TContext`), while defining clean, minimalistic interfaces for task execution. 

Instead of mimicking JavaScript's `AbortSignal`, we will embrace Go's native `context.Context` as the primary mechanism for handling cancellation, timeouts, and deadlines across all tasks. A `Task` interface will be defined requiring a `Run(ctx context.Context, sharedContext T) TaskResult` method. We will also define the `TaskResult` struct and the `TaskStatus` enumeration (using custom types and constants) to accurately reflect success, failure, skipping, and cancellation states.

## Epic 2: Graph Validation and Utilities

The `TaskGraphValidator` in TypeScript ensures that the workflow is a valid Directed Acyclic Graph (DAG) by checking for cycles, missing dependencies, and duplicate IDs. This logic is critical for preventing runtime deadlocks and must be ported meticulously. 

In Go, we will implement this validator returning idiomatic Go `error` types, potentially leveraging custom error structs that encapsulate validation details (e.g., `CycleError`, `MissingDependencyError`) to allow callers to inspect the exact nature of the failure using `errors.As`. Additionally, we will port the Mermaid graph generation utility, adapting the string manipulation and sanitization to use Go's `strings` and `regexp` packages effectively.

## Epic 3: Event System and Plugin Architecture

The TypeScript implementation relies on an `EventBus` and `PluginManager` to emit lifecycle events (`workflowStart`, `taskStart`, `taskEnd`, etc.). In Go, event-driven architectures are often best implemented using channels or interfaces rather than a central untyped bus. 

We propose designing small, focused interfaces for event listeners (e.g., `type TaskStartListener interface { OnTaskStart(...) }`). The `EventBus` equivalent will manage registering these listeners and broadcasting events. If events need to be processed asynchronously, we can utilize goroutines and buffered channels, ensuring that we design for safe concurrent access and avoid blocking the main execution loop. Plugins will simply be structs that implement one or more of these listener interfaces, making the plugin system highly decoupled and idiomatic.

## Epic 4: Thread-Safe State Management

The `TaskStateManager` tracks the progress of the workflow, identifying which tasks are pending, running, completed, or skipped, and handles the cascading of skipped states when dependencies fail. In Node.js, the single-threaded event loop makes state mutation straightforward. In Go, our executor will be highly concurrent.

To adapt this to Go, the state manager must be entirely thread-safe. We will encapsulate the internal maps and queues (such as the dependency graph and result storage) and protect them using `sync.Mutex` or `sync.RWMutex`. This epic will focus on ensuring that dependency resolution and state transitions (like marking a task as running or completed) are atomic operations, preventing race conditions when dozens of tasks might finish simultaneously in different goroutines.

## Epic 5: Concurrency and Workflow Execution

This epic is where Go will truly shine. The `WorkflowExecutor` in TypeScript uses a complex loop with Promises and a priority queue to manage concurrency. In Go, we will replace this with powerful concurrency primitives: goroutines and channels.

We will implement a worker-pool pattern or use semaphore channels to respect the configured concurrency limits. When tasks become ready (as dictated by the `TaskStateManager`), they will be dispatched to goroutines. We will use `select` statements to elegantly handle task completion alongside cancellation signals from the `context.Context`. This approach will yield a highly performant and readable executor that naturally handles timeouts, early exits, and parallel processing without the cognitive overhead of Promise chaining.

## Epic 6: Execution Strategies and Orchestration

The TypeScript version supports `ExecutionStrategy` patterns (Standard, Retrying, DryRun). We will port this by defining a simple `ExecutionStrategy` interface in Go that wraps the actual `Task.Run` call. Strategies like `RetryStrategy` can be implemented as decorators that consume this interface, leveraging Go's `time.Sleep` and `context` for backoffs.

Finally, we will port the `TaskRunner` orchestrator. We will implement an idiomatic configuration pattern, either through a Builder struct (`TaskRunnerBuilder`) or using the Functional Options pattern (e.g., `NewTaskRunner(ctx, WithConcurrency(5), WithPlugin(myPlugin))`), providing a clean, developer-friendly API to construct and execute the task graphs.
