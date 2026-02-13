# Engineering Tasks

- [ ] **Task 1: Update TaskStateManager to support Hydration**
  - Modify `src/TaskStateManager.ts`.
  - Add `hydrate(results: Map<string, TaskResult>): void` method.
  - This method should populate `this.results` with the provided map.
  - Ensure `processDependencies` can handle tasks being in `results` but not physically having just run (logic should already support this, but verify).

- [ ] **Task 2: Expose State in TaskRunner**
  - Modify `src/TaskRunner.ts`.
  - Add `getSnapshot(): Record<string, TaskResult>` method.
  - Converts the internal Map to a plain object for JSON serialization.

- [ ] **Task 3: Update TaskRunnerBuilder**
  - Modify `src/TaskRunnerBuilder.ts`.
  - Add `.loadState(snapshot: Record<string, TaskResult>)` method.
  - Store this state in the builder.
  - When `.build()` is called, pass this state to the `TaskRunner` (which might need a new method `runner.hydrate(...)` or constructor arg).

- [ ] **Task 4: Update WorkflowExecutor / TaskStateManager Interaction**
  - Ensure that when `TaskStateManager.initialize(steps)` is called, it respects the hydrated state.
  - If a step is in `results` (from hydration) and is `success`, it should NOT be added to `pendingSteps` (or `processDependencies` should immediately treat it as done).
  - _Refinement_: The `TaskStateManager.initialize` currently overwrites `pendingSteps`. It should probably filter out steps that are already in `results` with `success` status?
  - logic: `pendingSteps = new Set(steps.filter(s => !this.results.get(s.name) || this.results.get(s.name).status !== 'success'))`.
  - Check implications for `processDependencies`: If Step A is done (in results, not pending), and Step B depends on A. `processDependencies` checks `results.get('A')`. It finds it. It marks B as ready. This works.

- [ ] **Task 5: Unit Tests**
  - Create `tests/StatePersistence.test.ts`.
  - Test: Run A->B. Fail B. Snapshot.
  - Create new Runner with snapshot. Run.
  - Verify A does not run. B runs.
  - Test: Hydration with non-success status (should re-run).

- [ ] **Task 6: Documentation**
  - Update `README.md` with "Checkpointing & Resumption" section.
