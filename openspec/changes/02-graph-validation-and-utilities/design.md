## Context

The Go implementation needs to validate task graphs (preventing deadlocks caused by missing dependencies or cycles) and provide visual utilities (Mermaid graphs) just like the TypeScript version. We want to take advantage of Go's robust error handling mechanisms instead of simply panicking or throwing untyped errors.

## Goals / Non-Goals

**Goals:**
- Implement a graph validator that detects cycles, missing dependencies, and duplicate IDs.
- Create explicit, queryable Go error types (`ValidationError`, `CycleError`, `MissingDependencyError`).
- Port the Mermaid graph generation logic.

**Non-Goals:**
- Auto-fixing cyclic dependencies.
- Creating a full-fledged external Mermaid CLI tool (this is just an internal utility).

## Decisions

**1. Go Idiomatic Errors:**
- *Decision:* Define a slice of validation errors that implements the `error` interface, where each individual error can be type-asserted using `errors.As`.
- *Rationale:* Instead of returning a single string message, returning structured errors allows consumers to inspect exactly which tasks failed validation and why, enabling better programmatic error handling.

**2. Cycle Detection Algorithm:**
- *Decision:* Implement depth-first search (DFS) with a recursion stack to detect cycles, similar to the TypeScript implementation.
- *Rationale:* It is efficient (O(V+E)) and straightforward to track the actual cycle path to report back in the error message.

**3. Mermaid Generation String Manipulation:**
- *Decision:* Use `strings.Replacer` and compiled `regexp` for sanitizing node IDs and escaping special characters.
- *Rationale:* These are the standard, highly-optimized tools in Go's standard library for text manipulation. Using a single `strings.Builder` will also ensure the string concatenation is performant.

## Risks / Trade-offs

- [Risk] Performance overhead on very large graphs.
  → Mitigation: The validation step only runs once before the workflow starts. The graph sizes are typically small enough (tens to hundreds of nodes) that DFS and Map lookups will be instantaneous.
