## Context

Modern task runners in large repositories (e.g., Nx, Turborepo) allow developers to selectively run tasks using scopes, names, or tags (e.g., "only run linting for frontend"). Currently, our task runner forces users to supply exactly the tasks they want to execute, placing the burden of dependency resolution and subset filtering entirely on the consumer.

## Goals / Non-Goals

- **Goals:**
  - Provide an elegant API to execute a subset of tasks.
  - Enable tagging (`tags?: string[]`) of `TaskStep`s.
  - Automatically resolve required dependencies when a filtered task is explicitly requested.

- **Non-Goals:**
  - Build a full command-line parser for filtering arguments. We are only defining the configuration object API and programmatic filtering utility.

## Decisions

- **Decision 1: Programmatic Filtering Configuration**
  - We will introduce a `TaskFilterConfig` interface: `{ includeTags?: string[], excludeTags?: string[], includeNames?: string[], excludeNames?: string[], includeDependencies?: boolean }`.

- **Decision 2: Separation of Filtering Logic**
  - We will create a standalone pure utility (`src/utils/TaskFilter.ts`) that accepts all tasks and returns a filtered array.
  - The `TaskRunner` will apply this filter *before* executing validation or resolving the DAG graph, ensuring the runner only sees a coherent subset.

- **Decision 3: Handling Missing Dependencies**
  - If a task is selected, but `includeDependencies` is `false`, and the selected task depends on an unselected task, the `TaskGraphValidator` will naturally throw an error as it already checks for missing dependencies. We will document that users either must manually select dependencies, or set `includeDependencies: true`.
  - When `includeDependencies: true` (default), the `TaskFilter` utility will traverse the original array and pull in any unselected task that is a dependency of a selected task recursively.

## Risks / Trade-offs

- **Risk:** Complex filtering might result in unintuitive executions (e.g., excluding a tag but implicitly including a task with that tag because it's a dependency).
- **Mitigation:** We'll prioritize `exclude*` filters over dependencies. If a task is a dependency of an included task, but explicitly matches an `exclude*` condition, it will be excluded, which will subsequently trigger a `TaskGraphValidationError` notifying the user of the conflict.

## Open Questions

- Should we allow wildcard matching for names (e.g., `build-*`)? (Deferred for MVP. Exact string match only for now).
