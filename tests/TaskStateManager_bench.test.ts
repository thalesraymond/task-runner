import { describe, it, expect } from "vitest";
import { TaskStateManager } from "../src/TaskStateManager.js";
import { EventBus } from "../src/EventBus.js";
import { TaskStep } from "../src/TaskStep.js";
import { TaskResult } from "../src/TaskResult.js";

describe("TaskStateManager Performance Benchmark", () => {
  it("should process a linear chain of 5000 tasks efficiently", async () => {
    const taskCount = 5000;
    const steps: TaskStep<void>[] = [];

    // Create a linear chain: T0 -> T1 -> ... -> T(N-1)
    for (let i = 0; i < taskCount; i++) {
      steps.push({
        name: `T${i}`,
        run: async () => ({ status: "success" }),
        dependencies: i > 0 ? [`T${i - 1}`] : [],
      });
    }

    const eventBus = new EventBus<void>();
    const stateManager = new TaskStateManager<void>(eventBus);

    stateManager.initialize(steps);

    const startTime = performance.now();

    for (let i = 0; i < taskCount; i++) {
      // 1. Get ready tasks
      const ready = stateManager.processDependencies();

      // In a linear chain, we expect exactly 1 task to be ready at each step
      // (Except maybe the first one is ready initially, and then subsequent ones become ready)
      if (ready.length !== 1) {
        throw new Error(`Expected 1 ready task at step ${i}, got ${ready.length}`);
      }

      const task = ready[0];

      // 2. Mark it as completed (simulating execution)
      stateManager.markRunning(task);
      const result: TaskResult = { status: "success" };
      stateManager.markCompleted(task, result);
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    console.log(`\nBenchmark Result (Linear Chain N=${taskCount}): ${duration.toFixed(2)}ms`);

    // We expect this to be the baseline.
    // O(N^2) means ~5000^2 operations.
    // If we optimize to O(N), it should be much faster.
    // We use a loose assertion to avoid flakiness while preventing major regressions.
    expect(duration).toBeLessThan(1000);
  });


  it("should process 1,000,000 fan-out tasks efficiently", { timeout: 10000 }, async () => {
    const taskCount = 1000000;
    const steps: TaskStep<void>[] = [];

    // T0 is the root. T1...T(N-1) depend on T0.
    steps.push({
      name: "T0",
      run: async () => ({ status: "success" }),
      dependencies: [],
    });

    for (let i = 1; i < taskCount; i++) {
      steps.push({
        name: `T${i}`,
        run: async () => ({ status: "success" }),
        dependencies: ["T0"],
      });
    }

    const eventBus = new EventBus<void>();
    const stateManager = new TaskStateManager<void>(eventBus);

    stateManager.initialize(steps);

    let startTime = performance.now();
    let ready = stateManager.processDependencies();

    // Simulating T0 execution
    stateManager.markRunning(ready[0]);
    stateManager.markCompleted(ready[0], { status: "success" });

    // Now all 999,999 tasks should be ready
    let endTime = performance.now();
    console.log(`\nBenchmark Result (Fan-out prep): ${(endTime - startTime).toFixed(2)}ms`);

    startTime = performance.now();
    ready = stateManager.processDependencies(); // This is the call that copies the large readyQueue
    endTime = performance.now();

    const duration = endTime - startTime;
    console.log(`\nBenchmark Result (Fan-out N=${taskCount} processDependencies): ${duration.toFixed(2)}ms`);

    expect(ready.length).toBe(taskCount - 1);
    expect(duration).toBeLessThan(1000); // Loose assertion
  });

});
