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
    // We won't assert a specific time here to avoid flakiness, but we print it.
  });
});
