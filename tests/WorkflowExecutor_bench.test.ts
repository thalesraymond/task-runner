import { describe, it } from "vitest";
import { WorkflowExecutor } from "../src/WorkflowExecutor.js";
import { EventBus } from "../src/EventBus.js";
import { TaskStateManager } from "../src/TaskStateManager.js";
import { StandardExecutionStrategy } from "../src/strategies/StandardExecutionStrategy.js";
import { TaskStep } from "../src/TaskStep.js";

describe("WorkflowExecutor Benchmark", () => {
  it("should handle 10k tasks efficiently with concurrency", async () => {
    const count = 10000;
    const steps: TaskStep<unknown>[] = [];
    for (let i = 0; i < count; i++) {
      steps.push({
        name: `task-${i}`,
        run: async () => {
             // Simulate a tiny async work to ensure we actually have pending promises
             await Promise.resolve();
             return { status: "success" };
        },
      });
    }

    const eventBus = new EventBus<unknown>();
    const stateManager = new TaskStateManager(eventBus);
    const strategy = new StandardExecutionStrategy();

    // Concurrency 1000 to allow many promises in executingPromises
    const executor = new WorkflowExecutor({}, eventBus, stateManager, strategy, 1000);

    const start = performance.now();
    await executor.execute(steps);
    const end = performance.now();

    console.log(`Executed ${count} tasks in ${(end - start).toFixed(2)}ms`);
  }, 30000);
});
