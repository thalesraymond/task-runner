# Engineering Tasks

- [ ] **Task 1: Update Interface**
  - Modify `src/TaskStep.ts` to add `timeout?: number;` to the `TaskStep` interface.
  - Document the property (milliseconds).

- [ ] **Task 2: Add Timeout Logic to StandardExecutionStrategy**
  - Modify `src/strategies/StandardExecutionStrategy.ts`.
  - Inside `execute`:
    - Check if `step.timeout` is defined.
    - If yes, create an `AbortController`.
    - Set a `setTimeout` to trigger the controller.
    - Use `Promise.race` (or simply pass the new signal and wait) to handle the timeout.
    - **Crucial**: Ensure the new signal respects the _parent_ `signal` (if global cancel happens, local signal must also abort).
    - **Crucial**: Clean up the timer (`clearTimeout`) in a `finally` block.

- [ ] **Task 3: Unit Tests**
  - Create `tests/strategies/StandardExecutionStrategy.timeout.test.ts`.
  - Test case: Task finishes before timeout (success).
  - Test case: Task runs longer than timeout (failure/error).
  - Test case: Task receives AbortSignal on timeout.
  - Test case: Global cancellation overrides local timeout.

- [ ] **Task 4: Integration Test**
  - Update `tests/TaskRunner.test.ts` or create `tests/timeouts.test.ts`.
  - Define a workflow with a slow task and a short timeout.
  - Verify that the slow task fails, dependents are skipped, and independent tasks still complete (if any).
