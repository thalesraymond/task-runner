# Feature Ideas for TaskRunner

Based on the analysis of the `TaskRunner` codebase, the following 5 features are proposed to enhance the robustness, flexibility, and usability of the engine.

## 1. Dependency Graph Validation

**Problem:**
Currently, the `TaskRunner` detects circular dependencies or missing dependencies implicitly during the execution loop. This means a workflow might start executing tasks and fail halfway through when it gets stuck, potentially leaving the system in an inconsistent state.

**Solution:**
Implement a dedicated `DependencyGraph` class that performs static analysis of the task steps *before* execution begins.
- **Fail Fast:** Detect cycles and missing dependencies immediately.
- **Validation**: Ensure the graph is a valid DAG.
- **Implementation:** Create `src/DependencyGraph.ts` with methods like `validate(steps: TaskStep[])`.

## 2. Execution Control (AbortSignal & Timeout)

**Problem:**
Once `TaskRunner.execute()` is called, there is no way to cancel the operation externally. If a task hangs or if the user wants to abort the workflow (e.g., in a CLI or UI context), the runner continues until completion or failure.

**Solution:**
Update the `execute` method to accept an optional configuration object supporting `AbortSignal` and a global timeout.
- **AbortSignal:** Pass a signal that, when aborted, stops starting new tasks and optionally cancels running ones (if tasks support it).
- **Timeout:** Enforce a maximum duration for the entire workflow.

```typescript
interface RunnerOptions {
  signal?: AbortSignal;
  timeout?: number;
}
// execute(steps: TaskStep<TContext>[], options?: RunnerOptions)
```

## 3. Concurrency Limits

**Problem:**
The current implementation executes *all* independent tasks in parallel. In a large graph with many independent nodes, this could overwhelm system resources (CPU, memory) or hit external API rate limits.

**Solution:**
Add a concurrency control mechanism to the runner.
- **Throttle:** Limit the number of tasks running simultaneously.
- **Queueing:** Maintain a queue of ready tasks and only start them when a slot is available.
- **Config:** Add `concurrency: number` to the `RunnerOptions`.

## 4. Task Retry Policy

**Problem:**
Tasks run once and fail immediately if they throw an error or return a failure status. Network glitches or transient issues can cause an entire workflow to fail unnecessarily.

**Solution:**
Allow tasks to define a retry policy.
- **Configuration:** Update `TaskStep` interface to include optional `retry` config:
  ```typescript
  interface TaskRetryConfig {
    attempts: number;
    delay?: number; // ms
    backoff?: 'fixed' | 'exponential';
  }
  ```
- **Logic:** The runner should catch failures, check the retry policy, and re-queue the task after the specified delay.

## 5. Workflow Visualization / Dry Run

**Problem:**
It can be difficult to understand the execution flow of complex dependency graphs just by looking at the code. Users also can't easily verify the execution plan without running the side effects.

**Solution:**
Add a method or mode to visualize or preview the workflow.
- **Dry Run:** A `dryRun` flag in options that executes the graph traversal logic without calling `step.run()`, returning the planned execution order.
- **Visualization:** A helper method `getMermaidGraph(steps)` that returns a Mermaid.js string representing the DAG. This is excellent for documentation and debugging.
