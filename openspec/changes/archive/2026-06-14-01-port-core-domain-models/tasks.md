## 1. Domain Types Definition

- [x] 1.1 Define `TaskStatus` enumeration as a custom integer type
- [x] 1.2 Define `iota` constants for `StatusSuccess`, `StatusFailure`, `StatusSkipped`, and `StatusCancelled`
- [x] 1.3 Implement the `String()` method for `TaskStatus` to allow easy printing

## 2. Result and Interface Definition

- [x] 2.1 Define the `TaskResult` struct containing `Status` and `Error`
- [x] 2.2 Define the generic `Task[T any]` interface requiring the `Run(ctx context.Context, sharedContext T) TaskResult` method
- [x] 2.3 Create mock or dummy implementations of `Task[T any]` to verify interface constraints in unit tests
