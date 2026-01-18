# Change: Add Comprehensive Integration Tests

## Why

The current test suite relies heavily on unit tests and mocks. To ensure robust behavior in real-world scenarios, we need comprehensive integration tests that execute full task graphs without mocks, validating complex configurations and interactions.

## What Changes

- Create a dedicated `tests/integration-tests/` directory.
- Implement 10-20 integration test scenarios covering:
  - Linear and branching dependencies.
  - Failure handling and propagation.
  - Context mutation and sharing.
  - Timing and concurrency (real execution).
  - Cancellation and timeouts.
  - Error recovery (if retry policy is implemented, otherwise standard error states).

## Impact

- Affected specs: `task-runner` (no functional changes to the runtime, but validates existing specs)
- Affected code: `tests/integration-tests/*`
