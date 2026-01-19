# Nexus Journal

## 2024-05-23 - Reliability via Granularity

**Insight:** Users often confuse "Workflow Timeout" with "Task Timeout". A workflow might allow 5 minutes, but a single HTTP request shouldn't hang for 4 minutes.
**Action:** By pushing timeout logic down to the `TaskStep` level (and the Strategy layer), we remove the burden of "cooperative cancellation" from the user's business logic, enforcing it at the runner level. This makes the system "secure by default" against zombie tasks.
