# Feature: Workflow State Persistence (Checkpoint/Resume)

## 🎯 User Story

"As a DevOps engineer, I want to save the state of a running workflow and resume it later from where it left off (e.g., after a server crash, deployment, or manual pause), so that I don't have to re-run expensive or side-effect-heavy tasks."

## ❓ Why

1.  **Cost Efficiency**: Re-running tasks like AI model training, large data ingestion, or paid API calls wastes money and resources.
2.  **Safety & Idempotency**: Some tasks are not idempotent (e.g., "Charge Credit Card", "Send Email"). If a workflow crashes after these steps but before completion, re-running from scratch is dangerous.
3.  **Resilience**: Long-running workflows (minutes to hours) are vulnerable to transient infrastructure failures. Resuming from the last successful step allows recovery without total data loss.

## 🛠️ What Changes

1.  **State Exposure**: `TaskRunner` and `TaskStateManager` need to expose the current execution state (results of completed tasks).
2.  **Hydration**: `TaskRunnerBuilder` and `TaskStateManager` need a way to initialize with a pre-existing state (the snapshot).
3.  **Execution Logic**: `WorkflowExecutor` needs to respect the hydrated state—skipping tasks that are already marked as `success` in the snapshot, while treating them as satisfied dependencies for downstream tasks.

## ✅ Acceptance Criteria

- [ ] `TaskRunner` (or `TaskStateManager`) must expose a method to get a serializable snapshot of the current state (`results`).
- [ ] `TaskRunnerBuilder` must accept a snapshot to initialize the runner.
- [ ] When `execute` is called with a hydrated state:
    - Tasks marked as `success` in the snapshot MUST NOT run again.
    - Tasks marked as `success` in the snapshot MUST be treated as completed dependencies for pending tasks.
    - Tasks marked as `failure`, `cancelled`, or `skipped` in the snapshot SHOULD be re-evaluated (run again).
- [ ] Context (`TContext`) changes made by tasks in the previous run must be manually restored by the user (since context can contain non-serializable objects), OR the snapshot must include a mechanism to warn/handle context.
    - *Decision*: For MVP, the user is responsible for providing the initial `context` to the `TaskRunnerBuilder`. The *state* snapshot only tracks task status/results. If the context needs to be in a certain state for step N+1, the user must provide that context.
    - *Refinement*: The snapshot should strictly contain `Record<string, TaskResult>`.

## ⚠️ Constraints

- The `TContext` object is often non-serializable (contains functions, sockets, etc.). Therefore, this feature **only** persists the *execution graph state* (which tasks finished). The user is responsible for re-hydrating the `context` to a state suitable for resumption if necessary.
