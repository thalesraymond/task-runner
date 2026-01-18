## 2026-01-18 - TaskGraphValidationError
**Learning:** Generic errors hide structured validation data, forcing consumers to parse strings or guess what went wrong.
**Action:** Introduced `TaskGraphValidationError` which encapsulates the `ValidationResult`, allowing programmatic access to specific validation failures (e.g., missing dependencies, cycles).
