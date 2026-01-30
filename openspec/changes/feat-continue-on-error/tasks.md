# Tasks: Continue On Error

- [ ] **Update TaskStep Interface**
  - [ ] Add `continueOnError?: boolean` to `TaskStep<TContext>` in `src/TaskStep.ts`.
  - [ ] Update documentation comments for the new property.

- [ ] **Update TaskStateManager**
  - [ ] Modify `TaskStateManager` to store the full `TaskStep` definitions map (name -> step) during initialization (`initialize` method).
  - [ ] Update `processDependencies` to check `continueOnError` property when a dependency is in "failure" state.
  - [ ] If `continueOnError` is true, allow the dependent task to proceed (do not mark as skipped).

- [ ] **Tests**
  - [ ] Create a new test file `tests/continueOnError.test.ts`.
  - [ ] Test case: Task A fails (default) -> Task B is skipped. (Regression check)
  - [ ] Test case: Task A fails (continueOnError: true) -> Task B runs.
  - [ ] Test case: Task A fails (continueOnError: true) -> Task B runs -> Task C runs.
  - [ ] Test case: Task A fails (continueOnError: true) -> Task B fails (continueOnError: false) -> Task C skipped.
