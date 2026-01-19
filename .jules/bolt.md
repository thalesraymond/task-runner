# Bolt's Journal

## 2026-01-19 - Optimization of Dependency Resolution
**Learning:** Changing dependency resolution from O(N) scan to O(1) graph lookup significantly improves performance but requires careful handling of "skip propagation". When checking dependencies in reverse order, a simple pass might miss propagating skips unless dependents are immediately queued.
**Action:** Always verify "skip propagation" in DAG execution engines, especially when processing order isn't guaranteed. Use a queue-based approach for propagation.
