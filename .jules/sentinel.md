## 2026-06-15 - Graph Traversal DoS

**Vulnerability:** Recursive graph traversal (DFS) can lead to Denial of Service via Stack Overflow when processing deep user-supplied graphs.
**Learning:** Even with large stack limits, recursion is a risk for user-controlled data structures. Node.js stack size is finite.
**Prevention:** Use iterative algorithms with explicit stacks for graph traversal (e.g., cycle detection).

## 2024-05-22 - Mermaid Graph Sanitization Vulnerability

**Vulnerability:** The Mermaid graph generation logic in `TaskRunner.getMermaidGraph` used a weak sanitization method (only replacing spaces, colons, and quotes) which allowed special characters like `[]`, `()`, `{}` to pass through. This could result in invalid Mermaid syntax or potentially malicious graph structures if user input controlled task names.
**Learning:** Blocklists (replacing specific characters) are often insufficient because it's hard to predict all problematic characters.
**Prevention:** Use strict allowlists (e.g., `/[^a-zA-Z0-9_-]/g`) for identifiers that are used in structured output formats like Mermaid, ensuring only safe characters are included.
