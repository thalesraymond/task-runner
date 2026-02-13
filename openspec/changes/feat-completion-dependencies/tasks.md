# Engineering Tasks: Completion Dependencies

## 1. Contracts & Types

- [ ] **Modify `src/TaskStep.ts`**
  - Define `export type TaskRunCondition = 'success' | 'always';`
  - Define `export interface TaskDependencyConfig { step: string; runCondition?: TaskRunCondition; }`
  - Update `TaskStep` interface: `dependencies?: (string | TaskDependencyConfig)[];`

## 2. Validation Logic

- [ ] **Update `src/TaskGraphValidator.ts`**
  - Update `validate` method to handle mixed string/object arrays.
  - Extract the dependency name correctly for cycle detection and adjacency lists.
  - Ensure `checkMissingDependencies` checks the `step` property of config objects.

## 3. Core Logic (TaskStateManager)

- [ ] **Update `src/TaskStateManager.ts`**
  - **Data Structures**:
    - Change `dependencyGraph` to store metadata: `Map<string, { step: TaskStep<TContext>, condition: TaskRunCondition }[]>`.
  - **Initialization**:
    - Parse the mixed `dependencies` array during `initialize`.
    - Store the `runCondition` (default 'success') in the graph.
  - **Failure Handling (`cascadeFailure`)**:
    - When a task fails (or is skipped? No, only Failures trigger 'always'. Skips should still cascade Skips):
    - Iterate dependents.
    - If dependent has `condition === 'always'`:
      - Treat as "success" (call `handleSuccess` logic or equivalent: decrement count).
      - Do NOT add to `cascade` queue.
    - If dependent has `condition === 'success'`:
      - Mark skipped (existing logic).
      - Add to `cascade` queue.
  - **Skip Handling**:
    - If a task is SKIPPED, dependents with `runCondition: 'always'` should ALSO be skipped (because the parent never ran).
    - Ensure `cascadeFailure` distinguishes between "Failed" vs "Skipped" when checking the condition.

## 4. Testing

- [ ] **Unit Tests (`tests/TaskStateManager.test.ts`)**
  - Test initialization with mixed types.
  - Test failure propagation with 'always' condition (dependent runs).
  - Test skip propagation with 'always' condition (dependent skips).
- [ ] **Integration Tests (`tests/TaskRunner.test.ts`)**
  - Create a "Teardown" scenario:
    - Step 1: Setup (Success)
    - Step 2: Work (Failure) -> Depends on 1
    - Step 3: Cleanup (Success) -> Depends on 2 (Always)
  - Verify Step 3 runs.
  - Verify final Workflow status (should be Failure because Step 2 failed).
