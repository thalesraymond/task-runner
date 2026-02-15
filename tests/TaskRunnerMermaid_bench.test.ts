import { describe, it, expect } from "vitest";
import { TaskRunner } from "../src/TaskRunner.js";
import { TaskStep } from "../src/TaskStep.js";
import { performance } from "perf_hooks";

describe("TaskRunner Mermaid Graph Benchmark", () => {
  it("benchmarks getMermaidGraph with many tasks", () => {
    const numTasks = 10000;
    const steps: TaskStep<unknown>[] = [];
    for (let i = 0; i < numTasks; i++) {
      steps.push({
        name: `Task_${i}`,
        dependencies: i > 0 ? [`Task_${i - 1}`] : [],
        run: async () => ({ status: "success" }),
      });
    }

    const start = performance.now();
    const graph = TaskRunner.getMermaidGraph(steps);
    const end = performance.now();

    console.log(`getMermaidGraph with ${numTasks} tasks took ${end - start}ms`);
    console.log(`Graph length: ${graph.length} characters`);
    expect(end - start).toBeLessThan(2000);
  });

  it("benchmarks getMermaidGraph with many duplicate tasks", () => {
    const numTasks = 1000;
    const numDuplicates = 10;
    const steps: TaskStep<unknown>[] = [];
    for (let i = 0; i < numTasks; i++) {
      for (let j = 0; j < numDuplicates; j++) {
        steps.push({
          name: `Task_${i}`,
          dependencies: i > 0 ? [`Task_${i - 1}`] : [],
          run: async () => ({ status: "success" }),
        });
      }
    }

    const start = performance.now();
    const graph = TaskRunner.getMermaidGraph(steps);
    const end = performance.now();

    console.log(`getMermaidGraph with ${numTasks * numDuplicates} steps (${numTasks} unique) took ${end - start}ms`);
    console.log(`Graph length: ${graph.length} characters`);
    expect(end - start).toBeLessThan(1000);
  });
});
