# Feature: Completion Dependencies (Finally Tasks)

## User Story

"As a developer, I want to define tasks that run even if their dependencies fail (e.g., cleanup/teardown), so that I can ensure resources are released and the system is left in a clean state regardless of workflow success."

## The "Why"

Currently, the `TaskRunner` strictly propagates failures: if Task A fails, all tasks depending on A are automatically skipped. This behavior is correct for logical dependencies (e.g., "Build" -> "Deploy"), but strictly prohibits "Teardown" or "Compensation" patterns (e.g., "Provision" -> "Test" -> "Deprovision").

If "Test" fails, "Deprovision" is skipped, leaving expensive resources running.

While a `continueOnError` proposal exists, it marks a task as "Optional" (allowing _all_ dependents to proceed). It does not support the case where:

1. "Test" is CRITICAL (if it fails, the workflow should eventually fail).
2. "Deprovision" MUST run after "Test".
3. "Publish Results" (dependent on "Test") MUST skip if "Test" fails.

We need a way to define **Dependency Behavior** at the edge level.

## The "What"

We will extend the `dependencies` property in `TaskStep` to support granular configuration.

### Current

```typescript
dependencies: ["TaskA", "TaskB"];
```

### Proposed

```typescript
dependencies: [
  "TaskA",
  { step: "TaskB", runCondition: "always" }, // or 'complete'
];
```

The `runCondition` determines when the dependent becomes ready:

- `success` (Default): Ready only if dependency succeeds.
- `always`: Ready if dependency succeeds OR fails. (If dependency is _skipped_, the dependent is still skipped, as the parent never ran).

## Acceptance Criteria

- [ ] Support `dependencies` as an array of `string | DependencyConfig`.
- [ ] `DependencyConfig` schema: `{ step: string; runCondition?: 'success' | 'always' }`.
- [ ] **Scenario 1 (Success):** A -> B(always). A succeeds. B runs.
- [ ] **Scenario 2 (Failure):** A -> B(always). A fails. B runs.
- [ ] **Scenario 3 (Skip):** X(fail) -> A -> B(always). X fails, A skips. B skips (because A never ran).
- [ ] **Scenario 4 (Hybrid):** A(fail) -> B(always) -> C(standard).
  - A fails.
  - B runs (cleanup).
  - C skips (because B succeeded, but C implicitly depends on the _chain_? No, standard DAG. C depends on B. If B succeeds, C runs. Wait.)

**Refining Scenario 4:**
If C depends on B, and B runs (cleaning up A), C runs.
This might not be desired if C assumes A succeeded.
_Constraint:_ If C depends on B, it only cares about B. If C cares about A, it must depend on A explicitly.
_User Responsibility:_ Users must ensure that if C depends on B (cleanup), C can handle the fact that A might have failed. Or, C should also depend on A (standard) if it needs A's success.

## Constraints

- **Backward Compatibility:** Existing `string[]` syntax must work exactly as before.
- **Cycle Detection:** The validator must treat `{ step: "A" }` identical to `"A"` for cycle checks.
- **Type Safety:** The context passed to the task remains `TContext`. The task must safeguard against missing data if a dependency failed (e.g., checking `ctx.data` before use).
