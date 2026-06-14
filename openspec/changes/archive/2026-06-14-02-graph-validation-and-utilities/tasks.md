## 1. Graph Validation Errors

- [x] 1.1 Define structured error types `ValidationError`, `CycleError`, and `MissingDependencyError` implementing the `error` interface
- [x] 1.2 Write unit tests ensuring the error types can be properly asserted using `errors.As`

## 2. Graph Validator Implementation

- [x] 2.1 Implement the `Validate` function to check for duplicate task IDs in the task graph
- [x] 2.2 Implement missing dependency checks within the `Validate` function
- [x] 2.3 Implement cycle detection using depth-first search (DFS) and a recursion stack
- [x] 2.4 Add comprehensive test cases covering acyclic, cyclic, and disconnected graphs

## 3. Mermaid Generation Utility

- [x] 3.1 Implement a `GenerateMermaidGraph` function taking the graph/tasks as input
- [x] 3.2 Add string sanitization using `strings.Replacer` to escape special characters in node names safely
- [x] 3.3 Add unit tests verifying the output format matches valid Mermaid flowchart syntax
