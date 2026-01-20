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
