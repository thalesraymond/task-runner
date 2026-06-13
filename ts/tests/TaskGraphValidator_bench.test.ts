import { describe, it, expect } from "vitest";
import { TaskGraphValidator } from "../src/TaskGraphValidator.js";
import { TaskGraph } from "../src/TaskGraph.js";
import { performance } from "perf_hooks";

describe("TaskGraphValidator - Benchmark", () => {
  it("should detect cycle fast", () => {
    const validator = new TaskGraphValidator();
    const tasks = [];
    const depth = 500000;

    for (let i = 0; i < depth; i++) {
      tasks.push({
        id: `task-${i}`,
        dependencies: i > 0 ? [`task-${i - 1}`] : [],
      });
    }
    // create a cycle from the deepest node to the root node
    tasks[0].dependencies = [`task-${depth - 1}`];

    const graph: TaskGraph = { tasks };

    const start = performance.now();
    const result = validator.validate(graph);
    const end = performance.now();

    expect(result.isValid).toBe(false);
    console.log(`Cycle detection took ${end - start}ms`);
  });
});
