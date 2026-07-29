## Context

The task-runner has two implementations (TypeScript and Go) with strong unit test coverage (>90% each). Both expose identical concepts: task graphs with dependencies, parallel execution, cancellation, event emission, and pluggable strategies/plugins.

**Existing TS integration tests** (6 files in `ts/tests/integration-tests/`) cover: basic linear/branching workflows, concurrency timing, cancellation via AbortSignal, timeout, shared context mutation, error propagation, dry-run execution, circular/missing dependency detection, and large graph stress.

**What's missing from TS integration tests**: retry strategy, looping strategy, conditional execution, continueOnError, plugin lifecycle hooks, event emission verification, priority ordering, combined-feature scenarios (e.g., retries + cancellation + events), and the RetryingExecutionStrategy + LoopingExecutionStrategy wrapping StandardExecutionStrategy.

**Go tests** are all unit tests — no integration tests exist.

**Constraint**: All tests must be self-contained — no external service calls, no file I/O beyond what Node/Go runtime provides. If real I/O is needed (e.g., for file-based plugin loading), it must run in CI only.

## Goals / Non-Goals

**Goals:**

- Expand TS integration test suite to cover every feature: retries, loops, conditionals, continueOnError, plugins, events, priority, combined scenarios.
- Create a Go integration test suite covering: full workflow execution, concurrency, cancellation, error propagation, event dispatching, graph validation, combined scenarios.
- Add a GitHub Actions workflow that runs both suites and reports results.
- All tests use the same patterns as existing integration tests (no mocks, real TaskRunner/WorkflowExecutor instantiation).
- 100% coverage must remain intact — integration tests are additive, not replacements for unit tests.

**Non-Goals:**

- Modifying production source code (no refactoring, no API changes).
- Adding external dependencies (no testcontainers, no Docker).
- Cross-process communication testing (no IPC between TS and Go).
- Performance/benchmark testing (separate concern).

## Decisions

### Decision 1: Vitest table-driven parameterization for TS integration tests

**Context**: Many integration test scenarios share a common structure (define steps, execute, assert results) with variations in dependencies, durations, and expected outcomes.
**Decision**: Use Vitest `test.each` for parameterized scenarios and shared step-creation helpers (existing pattern in `basic-structure.test.ts`).
**Alternatives considered**: Factory functions per scenario — too much duplication. Snapshot testing — fragile for timing-sensitive scenarios.
**Consequence**: Clean, composable test helpers with clear scenario descriptions.

### Decision 2: Go integration tests in `runner_test` package (black-box)

**Context**: Go unit tests already use `package runner_test` for external testing. Integration tests should follow the same pattern to ensure they test the public API.
**Decision**: New integration test files use `package runner_test` and import `runner` package. Test helpers (e.g., `trackedTask`, `simpleTask`) are reused from existing test files where possible.
**Alternatives considered**: Separate `integration` build tag — adds complexity without benefit since all tests are self-contained.
**Consequence**: Integration tests run alongside unit tests (`go test ./...`), simplifying CI.

### Decision 3: Feature-gated CI workflow

**Context**: Both test suites must run in CI, but it should be easy to run them locally during development.
**Decision**: Single GitHub Actions workflow that triggers on push/PR to main, runs `pnpm test` (ts/) and `go test ./...` (go/). No separate integration test step since both suites are in the same test command.
**Alternatives considered**: Separate `integration` npm script — unnecessary since Vitest already finds all `*.test.ts` files.
**Consequence**: No additional CI complexity; integration tests are just added to the existing test discovery.

### Decision 4: Test scenarios mirror the proposal's capability spec

**Context**: The proposal defines specific capabilities (TS retry, TS looping, TS conditional, Go execution, Go cancellation, etc.). Requirements traceability is important.
**Decision**: Each capability from the proposal gets a dedicated test file or test section, named to match the capability (e.g., `retry-execution.test.ts`, `executor_integration_test.go`).
**Alternatives considered**: Single monolithic integration test file — harder to navigate and maintain.
**Consequence**: Clear mapping between spec requirements and test files. Easy to see what's covered.

## Risks / Trade-offs

| Risk                                              | Likelihood | Mitigation                                                                                                                                                  |
| ------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Timing-dependent tests flake in CI                | Medium     | Use generous timeouts, prefer logical assertions over timing assertions. Mark timing-sensitive tests with `@slow` and run separately if needed.             |
| Integration tests slow down `go test ./...`       | Low        | Go integration tests are self-contained and run in-memory — negligible overhead vs existing unit tests.                                                     |
| Go integration tests duplicate unit test coverage | Low        | Each integration test exercises the full stack (validate → execute → collect), unlike unit tests which test individual components with mocked dependencies. |
| Missing edge cases in combined scenarios          | Medium     | Design combined scenarios to cover real-world usage patterns: retry + cancellation, looping + conditional, plugin + events.                                 |
