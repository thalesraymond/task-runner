## Why

Unit tests validate individual components in isolation but cannot catch bugs that emerge from real execution — timing-dependent race conditions, event propagation ordering, plugin lifecycle interactions, and cross-component state consistency. Without integration tests, bugs in the interaction between TaskRunner, WorkflowExecutor, EventBus, strategies, and plugins can ship undetected. Adding integration tests for both the TypeScript and Go implementations ensures the task runner works correctly in live-like scenarios.

## What Changes

### New capabilities

- **TS integration test suite** — Expand existing integration tests to cover all remaining features: retry strategy, looping strategy, conditional execution, continueOnError, plugin lifecycle hooks, event emission during execution, priority ordering, and combined-feature scenarios.
- **Go integration test suite** — Create a full end-to-end integration test suite for the Go implementation covering workflow execution, concurrency, cancellation, error propagation, event dispatching, graph validation, and combined scenarios.
- **CI workflow** — Add a GitHub Actions workflow that runs both test suites and reports results. All tests are self-contained (no external calls).

### Modified capabilities

None — no existing spec-level behavior is changing.

## Impact

- `ts/tests/integration-tests/` — New test files added, existing files remain.
- `go/internal/runner/` — New `*_integration_test.go` files added alongside existing unit tests.
- `.github/workflows/integration-tests.yml` — New CI workflow.
- No changes to source code, public APIs, or dependencies.

## Rollback Plan

All changes are additive — new test files and CI configuration. Rollback is a simple revert or deletion of the new files. No production code is modified.

## Affected Teams

- Core maintainers (review + maintain integration tests)
- CI/CD (new workflow to monitor)
