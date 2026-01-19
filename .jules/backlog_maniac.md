## 2026-01-18 - TaskGraphValidationError

**Learning:** Generic errors hide structured validation data, forcing consumers to parse strings or guess what went wrong.
**Action:** Introduced `TaskGraphValidationError` which encapsulates the `ValidationResult`, allowing programmatic access to specific validation failures (e.g., missing dependencies, cycles).

## 2026-01-19 - Safe Mermaid IDs

**Learning:** Weak sanitization in Mermaid graph generation allowed invalid characters (e.g., `(`, `[`) to break the diagram syntax.
**Action:** Implemented a strict allowlist regex (`/[^a-zA-Z0-9_-]/g`) in `sanitizeMermaidId` to ensure robust node IDs.
