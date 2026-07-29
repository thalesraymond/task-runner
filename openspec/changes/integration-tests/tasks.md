## 1. TypeScript: Retry & Strategy Integration Tests

- [ ] 1.1 Add integration test for RetryingExecutionStrategy: task fails then succeeds on retry
- [ ] 1.2 Add integration test for RetryingExecutionStrategy: max attempts exhausted propagates failure to downstream
- [ ] 1.3 Add integration test for LoopingExecutionStrategy: task loops until condition is met
- [ ] 1.4 Add integration test for LoopingExecutionStrategy: maxIterations cap stops looping

## 2. TypeScript: Conditional, ContinueOnError, and Priority Tests

- [ ] 2.1 Add integration test for conditional tasks: condition satisfied runs, condition failed skips
- [ ] 2.2 Add integration test for continueOnError: downstream tasks execute after task failure
- [ ] 2.3 Add integration test for priority ordering: higher priority tasks execute first among ready tasks

## 3. TypeScript: Plugin and EventBus Integration Tests

- [ ] 3.1 Add integration test for plugin lifecycle hooks: beforeAll/afterAll/beforeTask/afterTask fire in order
- [ ] 3.2 Add integration test for plugin hooks receiving task context
- [ ] 3.3 Add integration test for EventBus lifecycle events: task-started/task-completed/task-failed emitted with correct payloads

## 4. TypeScript: Combined-Feature Integration Tests

- [ ] 4.1 Add integration test: retry strategy respects cancellation via AbortSignal
- [ ] 4.2 Add integration test: looping with conditional termination executes correctly
- [ ] 4.3 Add integration test: continueOnError combined with retries on independent branches

## 5. Go: Workflow Execution Integration Tests

- [ ] 5.1 Add integration test: linear workflow (A → B → C) executes in dependency order with all successes
- [ ] 5.2 Add integration test: branching workflow (A → [B, C] → D) executes with parallel B/C
- [ ] 5.3 Add integration test: large graph (25 nodes, grid pattern) executes successfully
- [ ] 5.4 Add integration test: concurrency limit caps parallel goroutines
- [ ] 5.5 Add integration test: unlimited concurrency (limit=0) runs all ready tasks in parallel

## 6. Go: Cancellation and Error Propagation Integration Tests

- [ ] 6.1 Add integration test: context cancellation stops running tasks and skips remaining
- [ ] 6.2 Add integration test: context timeout cancels long-running tasks (DeadlineExceeded)
- [ ] 6.3 Add integration test: task failure skips downstream, independent branches continue
- [ ] 6.4 Add integration test: multiple independent failures are all reported

## 7. Go: Graph Validation and Event Integration Tests

- [ ] 7.1 Add integration test: cycle detection returns descriptive error
- [ ] 7.2 Add integration test: missing dependency returns descriptive error
- [ ] 7.3 Add integration test: duplicate task ID returns descriptive error
- [ ] 7.4 Add integration test: WorkflowStartEvent and WorkflowCompleteEvent fire before/after execution
- [ ] 7.5 Add integration test: TaskStartedEvent/TaskCompletedEvent/TaskFailedEvent fire per task

## 8. CI Workflow

- [ ] 8.1 Create `.github/workflows/integration-tests.yml` with pnpm install + test for ts/ and go test for go/
- [ ] 8.2 Verify workflow runs both suites on push/PR to main and reports pass/fail

## 9. Verification

- [ ] 9.1 Run full TS test suite (pnpm test) — all existing + new tests pass at 100% coverage
- [ ] 9.2 Run full Go test suite (go test ./...) — all existing + new tests pass
- [ ] 9.3 Run pnpm lint — no new lint issues
