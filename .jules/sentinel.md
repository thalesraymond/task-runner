## 2026-06-15 - Graph Traversal DoS
**Vulnerability:** Recursive graph traversal (DFS) can lead to Denial of Service via Stack Overflow when processing deep user-supplied graphs.
**Learning:** Even with large stack limits, recursion is a risk for user-controlled data structures. Node.js stack size is finite.
**Prevention:** Use iterative algorithms with explicit stacks for graph traversal (e.g., cycle detection).
