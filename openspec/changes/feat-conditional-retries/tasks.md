# Engineering Tasks

- [ ] **Task 1: Update TaskRetryConfig Interface**
  - Modify `src/contracts/TaskRetryConfig.ts`.
  - Add `shouldRetry?: (error: unknown) => boolean;` to the `TaskRetryConfig` interface.
  - Document the property with JSDoc explaining its purpose (return true to retry, false to abort).

- [ ] **Task 2: Update RetryingExecutionStrategy Logic**
  - Modify `src/strategies/RetryingExecutionStrategy.ts`.
  - Inside the `execute` loop, after receiving a "failure" result:
    - Check if `config.shouldRetry` is defined.
    - If defined, call it with `result.error`.
    - If it returns `false`, break the loop and return the failure result immediately.
    - If it returns `true` (or is undefined), proceed with the existing retry logic (check attempts, delay).

- [ ] **Task 3: Unit Tests**
  - Create `tests/strategies/RetryingExecutionStrategy.conditional.test.ts` (or add to existing test file if small).
  - **Scenario 1**: `shouldRetry` returns `true`.
    - Setup a task that fails 2 times then succeeds.
    - Configure `shouldRetry: () => true`.
    - Verify it retries and eventually succeeds.
  - **Scenario 2**: `shouldRetry` returns `false`.
    - Setup a task that fails with a specific error "FatalError".
    - Configure `shouldRetry: (err) => err !== "FatalError"`.
    - Verify it does _not_ retry and returns failure immediately after the first attempt.
  - **Scenario 3**: `shouldRetry` is undefined (Legacy behavior).
    - Setup a failing task.
    - Verify it retries up to max attempts.

- [ ] **Task 4: Integration Test**
  - Create `tests/integration-tests/conditional-retries.test.ts`.
  - Define a workflow with two tasks:
    - Task A: Fails with "Transient" error (retries allowed).
    - Task B: Fails with "Permanent" error (retries blocked by predicate).
  - Execute workflow.
  - Verify Task A consumed its retries (or succeeded).
  - Verify Task B failed immediately (did not consume retries).
