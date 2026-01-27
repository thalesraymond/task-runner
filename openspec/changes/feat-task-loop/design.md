## Context

Users need to poll external systems (APIs, databases) until a condition is met. Currently, this is done manually inside tasks, leading to poor visibility and conflation of "waiting" with "errors".

## Goals / Non-Goals

- **Goals**:
    - Allow declarative definition of polling loops.
    - Separate "Transient Failure" (network error) handling from "Business Logic Waiting" (status != 'done').
    - Provide visibility into loop iterations (optional future goal, but foundationally supported).
- **Non-Goals**:
    - "Foreach" loops (iterating over a list). This is strictly for "Do ... While" polling.

## Decisions

- **Decision**: `LoopingExecutionStrategy` wraps `RetryingExecutionStrategy`.
    - **Rationale**: A network error during a poll attempt should trigger a retry of *that specific attempt*. If the attempt succeeds (network-wise) but the data indicates "not ready", the Loop strategy handles the waiting and re-execution.
    - **Trade-off**: Increases call stack depth.
- **Decision**: `TaskLoopConfig` resides on `TaskStep`.
    - **Rationale**: Co-locates configuration with the task definition.

## Risks / Trade-offs

- **Risk**: Infinite loops if `maxIterations` is not set or set too high.
    - **Mitigation**: `maxIterations` should be mandatory or have a strict default (e.g., 100).

## Open Questions

- Should we expose `iteration` count to the `run` method?
    - *Decision*: Not for MVP. The `run` method should be stateless/idempotent ideally.
