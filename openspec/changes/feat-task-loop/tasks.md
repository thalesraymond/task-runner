# Engineering Tasks

- [ ] **Task 1: Define TaskLoopConfig Interface**
  - Create `src/contracts/TaskLoopConfig.ts`.
  - Define the interface:
    ```typescript
    import { TaskResult } from "../TaskResult.js";

    export interface TaskLoopConfig<TContext> {
      /**
       * Predicate to determine if the loop should stop.
       * Returns true when the condition is satisfied (loop ends).
       * Returns false to continue looping.
       */
      done: (context: TContext, lastResult: TaskResult) => boolean | Promise<boolean>;

      /**
       * Delay in milliseconds between iterations.
       * Default: 1000ms.
       */
      delay?: number;

      /**
       * Maximum number of iterations to prevent infinite loops.
       * Default: 100.
       */
      maxIterations?: number;
    }
    ```
  - Update `src/TaskStep.ts` to include `loop?: TaskLoopConfig<TContext>;`.

- [ ] **Task 2: Create LoopingExecutionStrategy**
  - Create `src/strategies/LoopingExecutionStrategy.ts`.
  - Implement `IExecutionStrategy`.
  - Logic:
    - Execute wrapped strategy (e.g., `RetryingExecutionStrategy`).
    - If result is NOT `success` (e.g., `failed`, `skipped`, `cancelled`), return it immediately. The loop only continues on successful execution that hasn't met the business condition yet.
    - Check `loop.done(context, result)`.
      - If `true`: Return the result (Loop finished).
      - If `false`:
        - Check `maxIterations`. If reached, return a failure result with `message: "Loop max iterations reached"`.
        - Wait for `loop.delay` (handling cancellation via `AbortSignal`).
        - Repeat execution.

- [ ] **Task 3: Integrate Looping Strategy**
  - Update `src/TaskRunner.ts`.
  - Wrap the existing strategy chain with `LoopingExecutionStrategy`.
  - Current chain: `Retrying(Standard)`.
  - New chain: `Looping(Retrying(Standard))`.
  - Ensure `dryRun` strategy bypasses the loop (or maybe simulates one iteration?).

- [ ] **Task 4: Unit Tests**
  - Create `tests/strategies/LoopingExecutionStrategy.test.ts`.
  - **Scenario 1**: Condition met immediately (1 iteration).
  - **Scenario 2**: Condition met after 3 iterations.
  - **Scenario 3**: Max iterations exceeded (fails).
  - **Scenario 4**: Underlying task fails (e.g., network error). Loop stops immediately.
  - **Scenario 5**: Cancellation signal received during delay. Loop stops.

- [ ] **Task 5: Integration Test**
  - Create `tests/integration/TaskLoop.test.ts`.
  - Real-world simulation: "Database Polling".
  - Context has `{ dbReady: false }`.
  - Task checks `dbReady`.
  - `loop.done` checks `result`.
  - Simulate `dbReady = true` after 50ms.
  - Verify task ran multiple times and eventually succeeded.
