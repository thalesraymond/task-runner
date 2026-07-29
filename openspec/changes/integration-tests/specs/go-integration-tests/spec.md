## ADDED Requirements

### Requirement: Full workflow executes end-to-end with all tasks succeeding

The Go implementation SHALL execute a complete workflow from graph definition through validation, execution, and result collection. All tasks in a valid graph SHALL complete successfully.

#### Scenario: Linear workflow executes in order

- **WHEN** a linear task graph (A → B → C) is defined, validated, and executed
- **THEN** all tasks SHALL have StatusSuccess and tasks SHALL execute in dependency order

#### Scenario: Branching workflow executes in parallel

- **WHEN** a branching task graph (A → [B, C] → D) is defined and executed
- **THEN** B and C SHALL execute concurrently after A completes, and D SHALL execute after both complete

#### Scenario: Large graph with 25+ nodes executes correctly

- **WHEN** a grid-shaped graph with 5 layers of 5 nodes (25 total) is executed
- **THEN** all tasks SHALL have StatusSuccess and the execution SHALL complete without error

### Requirement: Concurrency control limits parallel execution

The Go implementation SHALL respect the configured concurrency limit when executing independent tasks in parallel.

#### Scenario: Concurrency limit caps simultaneous goroutines

- **WHEN** a workflow has 10 independent tasks with a concurrency limit of 3
- **THEN** no more than 3 tasks SHALL run simultaneously at any point

#### Scenario: Zero concurrency limit allows unlimited parallelism

- **WHEN** a workflow has many independent tasks with concurrency limit set to 0
- **THEN** all tasks SHALL execute concurrently up to the total task count

### Requirement: Cancellation via context propagates to running tasks

The Go implementation SHALL support cancellation via `context.Context`. When the context is cancelled, running tasks SHALL be notified and stopped.

#### Scenario: Context cancellation stops running tasks

- **WHEN** the execution context is cancelled while tasks are running
- **THEN** the executor SHALL return ctx.Err() and all running tasks SHALL be cancelled

#### Scenario: Timeout via contextWithTimeout cancels long-running tasks

- **WHEN** a timeout context is used and tasks exceed the timeout
- **THEN** the executor SHALL return DeadlineExceeded and long-running tasks SHALL be cancelled

#### Scenario: Unstarted tasks are skipped after cancellation

- **WHEN** the context is cancelled with some tasks still queued
- **THEN** those tasks SHALL NOT execute and SHALL be marked as skipped

### Requirement: Task failure propagates correctly

The Go implementation SHALL handle task failures by skipping downstream dependents while allowing independent branches to continue.

#### Scenario: Failed task causes downstream skip

- **WHEN** a task fails (returns StatusFailed)
- **THEN** all tasks that depend on it SHALL be skipped, but independent tasks SHALL continue

#### Scenario: Multiple independent failures are reported

- **WHEN** multiple independent tasks fail
- **THEN** the executor SHALL continue executing remaining independent tasks and report all failures

### Requirement: Graph validation detects invalid graphs

The Go implementation SHALL validate task graphs before execution and reject invalid graphs with descriptive errors.

#### Scenario: Cycle detection rejects circular dependencies

- **WHEN** a graph with a cycle (A → B → C → A) is validated
- **THEN** validation SHALL return an error indicating a cycle was detected

#### Scenario: Missing dependency detection

- **WHEN** a task depends on a non-existent task
- **THEN** validation SHALL return an error identifying the missing dependency

#### Scenario: Duplicate task ID detection

- **WHEN** two tasks share the same ID
- **THEN** validation SHALL return an error about the duplicate

### Requirement: Event dispatcher fires lifecycle events

The Go implementation's EventDispatcher SHALL fire events at key lifecycle points during workflow execution.

#### Scenario: WorkflowStart and WorkflowComplete events fire

- **WHEN** a workflow executes
- **THEN** a WorkflowStartEvent SHALL fire before any task runs, and a WorkflowCompleteEvent SHALL fire after all tasks complete

#### Scenario: Task lifecycle events fire per task

- **WHEN** a workflow executes
- **THEN** TaskStartedEvent and TaskCompletedEvent/TaskFailedEvent SHALL fire for each task
