## 2024-05-24 - Task Graph Validation Efficiency
**Learning:** Graph validation was iterating the task list multiple times (checking duplicates, checking missing deps, checking cycles). Consolidating these into a single pass to build an adjacency list reduced validation time by ~10% for large linear graphs.
**Action:** When validating graph structures, build an efficient lookup structure (Map/Set) in the first pass and use it for subsequent checks to avoid O(N) re-scanning.

## 2024-05-24 - Coverage of Graph Traversal Loops
**Learning:** Achieving 100% coverage in iterative DFS/BFS loops requires test cases that trigger the "visited" check (hitting a node that was already visited in a previous traversal from the outer loop). Simple linear or disjoint graphs might not trigger this if the order of iteration perfectly matches the dependency chain.
**Action:** Include fully connected graph test cases or ensure specific iteration orders to verify `continue` branches in graph traversal loops.
