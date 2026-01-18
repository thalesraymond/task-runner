# Engineering Tasks

- [ ] **Task 1: Update Interface**
  - Modify `src/TaskStep.ts` to add `condition?: (context: T) => boolean | Promise<boolean>;` to the `TaskStep` interface.
  - Add JSDoc to explain that if condition returns false, the task is skipped.

- [ ] **Task 2: Implement Conditional Logic in TaskStateManager**
  - Analyze `src/TaskStateManager.ts` and `src/WorkflowExecutor.ts`.
  - Determine the best place to evaluate the condition. Likely in `WorkflowExecutor` before calling `strategy.execute`, OR in `TaskStateManager` when processing dependencies?
  - Actually, `WorkflowExecutor.processLoop` calls `stateManager.markRunning(step)`.
  - It should probably be:
    ```typescript
    const shouldRun = await evaluateCondition(step, context);
    if (!shouldRun) {
        stateManager.markResult(step, { status: 'skipped' });
        // emit skipped event
        return;
    }
    stateManager.markRunning(step);
    strategy.execute(...)
    ```
  - Note: `evaluateCondition` needs to handle both sync and async results.

- [ ] **Task 3: Unit Tests**
  - Create `tests/conditional.test.ts` (or add to `tests/TaskRunner.test.ts`).
  - Test: Task with condition `() => false` is skipped.
  - Test: Task with condition `() => true` runs.
  - Test: Task with async condition skipping.
  - Test: Dependent tasks are also skipped (or handle skip propagation correctly).

- [ ] **Task 4: Verify Dry Run Behavior**
  - Ensure Dry Run strategy still respects condition if possible, OR clarify in spec that condition is evaluated normally even in dry run (since it's a predicate, not side-effect).
