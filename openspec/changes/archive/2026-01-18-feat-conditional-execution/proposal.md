# Feature: Conditional Task Execution

## 🎯 User Story

"As a developer, I want to define a condition for a task so that it only executes when specific criteria are met (e.g., only on CI, or only if a previous task generated a specific output), avoiding unnecessary execution and manual checks inside the task logic."

## ❓ Why

Currently, to skip a task based on context, a developer must implement the check inside the `run` method and return `{ status: 'skipped' }`. This has downsides:

1.  **Late Binding**: The task is already "started" (event emitted) before it decides to skip itself.
2.  **Boilerplate**: Every task needs `if (!shouldRun) return { status: 'skipped' }`.
3.  **Clarity**: Examining the task definition (e.g. `TaskStep` object) doesn't reveal *when* it runs, only *what* it does. A declarative `condition` property makes the workflow logic more transparent.
4.  **Dry Run Accuracy**: In a dry run, we might want to know if a task *would* run. If the logic is inside `run`, strictly disjoint from the runner, a dry run (which skips `run`) cannot predict if the task would be skipped.

## 🛠️ What Changes

1.  **Interface Update**: Update `TaskStep<T>` to accept an optional `condition` property:
    ```typescript
    condition?: (context: T) => boolean | Promise<boolean>;
    ```
2.  **State Manager/Workflow Executor Update**:
    - Before marking a task as `running`, evaluate `condition(context)`.
    - If `false`, mark the task as `skipped` immediately without calling `run()`.
    - Emit `taskSkipped` event.
    - Consistency: Ensure that skipping a task triggers the standard skip propagation for dependent tasks (as currently documented in README).

## ✅ Acceptance Criteria

- [ ] A task with `condition: () => false` must result in a `skipped` status.
- [ ] The `run` method of a conditionally skipped task must **not** be called.
- [ ] A task with `condition: () => true` (or undefined) must execute normally.
- [ ] The `condition` function receives the current `context`.
- [ ] Async `condition` functions are awaited.
- [ ] `taskSkipped` event is emitted when condition fails.
