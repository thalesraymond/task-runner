## 1. Implementation

- [ ] 1.1 Update `TaskStep.ts` interface to include an optional `matrix` property (e.g., `Record<string, unknown[]>`).
- [ ] 1.2 Update the `TaskRunnerBuilder` and `TaskGraph` validation to accept and validate the `matrix` property.
- [ ] 1.3 Implement a matrix permutation generator utility to compute Cartesian products of matrix dimensions.
- [ ] 1.4 Update `TaskStateManager.ts` or `TaskGraph.ts` to dynamically expand matrix steps into individual nodes during initialization, resolving dependencies appropriately.
- [ ] 1.5 Update the task execution context to provide the current matrix permutation variables to the `run` function.
- [ ] 1.6 Update the Mermaid Graph utility in `TaskRunner.ts` to correctly output nodes and edges for the dynamically generated matrix steps.
- [ ] 1.7 Add unit tests covering matrix generation, execution, failure handling, and context passing.
- [ ] 1.8 Add benchmarks for graph generation and state initialization with large matrix sets to ensure performance targets are met.
