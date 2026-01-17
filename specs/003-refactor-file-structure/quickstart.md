# Quickstart

This guide provides a basic example of how to use the `task-runner` library to execute a set of dependent tasks.

## Installation

```bash
# (This is a hypothetical installation command)
npm install task-runner
```

## Usage

The following example demonstrates how to define a series of tasks and run them.

- **Task A**: Runs first.
- **Task B**: Runs first.
- **Task C**: Runs after A and B have both completed successfully.

```typescript
import { TaskRunner, TaskStep } from "task-runner";

// Define the steps for the workflow
const steps: TaskStep<unknown>[] = [
  {
    name: "A",
    run: async () => {
      console.log("Task A completed");
      return { status: "success" };
    },
  },
  {
    name: "B",
    run: async () => {
      console.log("Task B completed");
      return { status: "success" };
    },
  },
  {
    name: "C",
    dependencies: ["A", "B"],
    run: async () => {
      console.log("Task C completed");
      return { status: "success" };
    },
  },
];

// Create a new TaskRunner instance with an empty context
const runner = new TaskRunner({});

// Execute the tasks
runner.execute(steps).then((results) => {
  console.log("All tasks finished!");
  results.forEach((result, name) => {
    console.log(`- ${name}: ${result.status}`);
  });
});

/**
 * Expected Output:
 *
 * Task A completed
 * Task B completed
 * Task C completed
 * All tasks finished!
 * - A: success
 * - B: success
 * - C: success
 */
```
