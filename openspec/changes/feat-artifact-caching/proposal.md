# Feature: Artifact Caching

## 🎯 User Story

"As a developer, I want to skip the execution of time-consuming tasks (like compilation or testing) if their inputs haven't changed since the last successful run, so that I can significantly speed up my feedback loop and CI pipelines."

## ❓ Why

1.  **Performance**: In a typical development workflow, many tasks are re-run unnecessarily. For example, running a linter on the entire codebase when only one file changed, or rebuilding a project when no source files were touched.
2.  **Efficiency**: Re-running expensive tasks wastes CPU cycles and time, especially in large monorepos or complex pipelines.
3.  **Standard DX**: Modern task runners (Nx, Turborepo, Gradle, Bazel) all provide this feature. Its absence is a significant competitive gap.

## 🛠️ What Changes

1.  **Task Definition**: Update `TaskStep` to allow defining `cache` configuration:
    -   `inputs`: Files (globs) and environment variables that the task depends on.
    -   `outputs`: Directories or files that the task produces.
2.  **Hashing**: Implement a `CacheManager` that calculates a cryptographic hash (e.g., SHA-256) of the inputs.
3.  **Storage**: Implement a local storage mechanism (e.g., in `node_modules/.cache/@calmo/task-runner`) to store the outputs of successful tasks, keyed by their input hash.
4.  **Execution Strategy**: Introduce a `CachingExecutionStrategy` (or modify `StandardExecutionStrategy`) that:
    -   Calculates the input hash before execution.
    -   Checks the cache for a hit.
    -   **If Hit**: Restores the output files from the cache to the workspace and skips the task execution (marking it as "cached").
    -   **If Miss**: Executes the task. If successful, stores the defined output files into the cache.

## ✅ Acceptance Criteria

- [ ] Users can define `inputs` (file patterns, env vars) and `outputs` (paths) in `TaskStep`.
- [ ] The runner calculates a unique hash based on the content of input files and values of env vars.
- [ ] If the hash matches a previous run, the task is *not* executed.
- [ ] If the hash matches, the output files are correctly restored from the cache to the project directory.
- [ ] If the task runs successfully, its outputs are saved to the cache.
- [ ] Users can opt-out of caching (default behavior) or force a refresh (e.g., via a flag or `inputs` change).
- [ ] Cache logic is robust against missing files or permission errors (should degrade gracefully to running the task).

## ⚠️ Constraints

-   **Local Only**: This proposal only covers local file-based caching. Remote caching is out of scope for now.
-   **Side Effects**: Tasks with side effects outside of the declared `outputs` (e.g., database writes, external API calls) should *not* be cached or should be cached with caution. The documentation must warn users about this.
-   **Determinism**: Caching relies on tasks being deterministic. If a task produces different outputs for the same inputs (e.g., includes a timestamp), the cache might be misleading, though input hashing mitigates this for *decision* making.
