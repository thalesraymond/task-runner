# Quickstart: Using the Task Graph Validator

This document outlines how to integrate and use the `TaskGraphValidator` for pre-execution validation of task graphs. This validator ensures the structural integrity of your task workflows by identifying common issues like cycles, missing dependencies, and duplicate tasks before execution begins.

### 1. Integrate the Validator

The `TaskGraphValidator` is designed to be an internal component, primarily used by the `TaskRunner` itself. You would typically instantiate it within your `TaskRunner` and invoke its `validate` method before initiating task execution.

```typescript
// In TaskRunner.ts (conceptual integration)

// Import the necessary interfaces and the validator implementation
import {
  ITaskGraphValidator,
  TaskGraph,
  ValidationResult,
} from "../specs/004-pre-execution-validation/contracts/api";
import { TaskGraphValidator } from "../../src/TaskGraphValidator"; // Assuming implementation path

export class TaskRunner {
  private validator: ITaskGraphValidator;

  constructor() {
    // Initialize the validator
    this.validator = new TaskGraphValidator();
  }

  /**
   * Runs the given task graph after performing a pre-execution validation.
   * @param graph The task graph to execute.
   * @returns A promise that resolves when the graph execution is complete.
   * @throws An error if the task graph is invalid.
   */
  async run(graph: TaskGraph): Promise<void> {
    // Perform validation before starting execution
    const validationResult: ValidationResult = this.validator.validate(graph);

    if (!validationResult.isValid) {
      // Log or handle validation errors
      console.error("Task graph validation failed:", validationResult.errors);
      // Prevent execution if the graph is invalid
      throw new Error("Invalid task graph. See errors for details.");
    }

    // If validation passes, proceed with the actual task execution logic
    console.log("Task graph is valid. Proceeding with execution...");
    // ... actual task execution logic for the graph ...
    return Promise.resolve(); // Placeholder
  }
}
```

### 2. Define Your Task Graph

Your task graph should conform to the `TaskGraph` interface defined in `contracts/api.ts`. It is an object containing an array of `Task` objects, where each `Task` has a unique `id` and an array of `dependencies`.

```typescript
import { TaskGraph } from "../../specs/004-pre-execution-validation/contracts/api";

// Example of a valid task graph
const validGraph: TaskGraph = {
  tasks: [
    { id: "A", dependencies: [] },
    { id: "B", dependencies: ["A"] },
    { id: "C", dependencies: ["A", "B"] },
  ],
};

// Example of an invalid task graph (with a cycle: A depends on B, B depends on A)
const cyclicGraph: TaskGraph = {
  tasks: [
    { id: "A", dependencies: ["B"] },
    { id: "B", dependencies: ["A"] },
  ],
};

// Example of an invalid task graph (with a missing dependency: 'X' is not defined)
const missingDepGraph: TaskGraph = {
  tasks: [
    { id: "A", dependencies: ["X"] }, // 'X' is a dependency but no task 'X' exists
  ],
};

// Example of an invalid task graph (with duplicate task ID 'A')
const duplicateTaskGraph: TaskGraph = {
  tasks: [
    { id: "A", dependencies: [] },
    { id: "A", dependencies: ["B"] }, // Task 'A' is defined twice
  ],
};
```

### 3. Handle Validation Results

When calling `validator.validate(graph)`, you receive a `ValidationResult`. It's crucial to check the `isValid` property. If `false`, iterate through the `errors` array to understand the specific issues, which will include the `type` of error and a `message`.

```typescript
import { TaskRunner } from "./TaskRunner"; // Assuming TaskRunner is implemented in current directory
import { TaskGraph } from "../../specs/004-pre-execution-validation/contracts/api";

const runner = new TaskRunner();

// Scenario 1: Valid graph
runner
  .run(validGraph)
  .then(() => console.log("Valid graph executed successfully."))
  .catch((error) =>
    console.error("Error executing valid graph:", error.message)
  );

// Scenario 2: Cyclic graph (will throw an error)
runner
  .run(cyclicGraph)
  .then(() => console.log("Cyclic graph executed (should not happen)."))
  .catch((error) =>
    console.error("Error executing cyclic graph:", error.message)
  );
// Expected output: "Error executing cyclic graph: Invalid task graph. See errors for details."

// Scenario 3: Graph with missing dependency (will throw an error)
runner
  .run(missingDepGraph)
  .then(() =>
    console.log("Graph with missing dependency executed (should not happen).")
  )
  .catch((error) =>
    console.error(
      "Error executing graph with missing dependency:",
      error.message
    )
  );

// Scenario 4: Graph with duplicate tasks (will throw an error)
runner
  .run(duplicateTaskGraph)
  .then(() =>
    console.log("Graph with duplicate tasks executed (should not happen).")
  )
  .catch((error) =>
    console.error("Error executing graph with duplicate tasks:", error.message)
  );
```
