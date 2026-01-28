# Nexus Journal

## 2024-05-23 - Reliability via Granularity

**Insight:** Users often confuse "Workflow Timeout" with "Task Timeout". A workflow might allow 5 minutes, but a single HTTP request shouldn't hang for 4 minutes.
**Action:** By pushing timeout logic down to the `TaskStep` level (and the Strategy layer), we remove the burden of "cooperative cancellation" from the user's business logic, enforcing it at the runner level. This makes the system "secure by default" against zombie tasks.

## 2024-05-24 - The Value of Resumability

**Insight:** In distributed systems or long-running local scripts, "Retry from scratch" is a naive default. Users fear side effects (double-billing, double-emailing).
**Action:** Treating the `TaskResult` map as a portable "Save Game" file transforms the library from a simple runner into a resilient engine. The key is separating "Execution State" (which tasks passed) from "Runtime Context" (variables in memory). By persisting only the former, we avoid the nightmare of serializing closures/sockets while still solving the user's primary pain point: "Don't do the hard work twice."

## 2026-01-17 - Performance Visibility

**Insight:** Users' optimization efforts are blind without granular metrics. Users often don't know *which* task is slow, only that the workflow is slow.
**Action:** Always include telemetry requirements (like start/end times and duration) in execution engine specs to enable data-driven optimization.

## 2026-01-20 - The "All or Nothing" Retry Trap

**Insight:** Blindly retrying failing tasks is a "Product Anti-pattern". Retrying a `SyntaxError` or invalid user input 3 times (with exponential backoff!) is annoying and wasteful.
**Action:** We must distinguish between "Transient" (network, resource lock) and "Permanent" (logic, validation) failures. Exposing a `shouldRetry` predicate gives the user control without complicating the core runner logic.

## 2026-01-24 - The Cleanup Paradox

**Insight:** "Continue On Error" is often misused for Cleanup logic. Users mark critical tasks as "Optional" just to ensure subsequent cleanup tasks run, which incorrectly allows *other* dependents to run too. True "Teardown" requires the *dependent* to assert its resilience, not the *dependency* to declare its weakness.
**Action:** Invert the control. Instead of the failing task saying "I don't matter" (`continueOnError`), the cleanup task should say "I run anyway" (`runCondition: 'always'`). This preserves the criticality of the workflow while ensuring resource hygiene.

## 2026-01-28 - Loop vs Retry Separation

**Insight:** "Retry" implies failure correction. "Loop" implies waiting for state. Conflating them (e.g. "Retry if 202 Accepted") confuses the semantic meaning of the workflow and complicates strategy logic.
**Action:** Strictly separate `RetryingExecutionStrategy` (handling Exceptions/Errors) from `LoopingExecutionStrategy` (handling Conditions/Predicates). This keeps each strategy single-purpose and composable.
