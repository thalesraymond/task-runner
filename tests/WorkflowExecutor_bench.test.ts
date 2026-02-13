import { describe, it } from "vitest";
import { WorkflowExecutor } from "../src/WorkflowExecutor.js";
import { TaskStateManager } from "../src/TaskStateManager.js";
import { EventBus } from "../src/EventBus.js";
import { TaskStep } from "../src/TaskStep.js";
import { StandardExecutionStrategy } from "../src/strategies/StandardExecutionStrategy.js";

describe("WorkflowExecutor Performance Benchmark", () => {
  it("should execute 10000 concurrent tasks efficiently", async () => {
    const taskCount = 10000;
    const steps: TaskStep<Record<string, unknown>>[] = [];

    for (let i = 0; i < taskCount; i++) {
      steps.push({
        name: `T${i}`,
        run: async () => {
          await new Promise((resolve) =>
            setTimeout(resolve, Math.random() * 5)
          );
          return { status: "success" };
        },
        dependencies: [],
      });
    }

    const context: Record<string, unknown> = {};
    const eventBus = new EventBus<Record<string, unknown>>();
    const stateManager = new TaskStateManager<Record<string, unknown>>(
      eventBus
    );
    const strategy = new StandardExecutionStrategy();

    // High concurrency to force large Promise.race set
    const executor = new WorkflowExecutor<Record<string, unknown>>(
      context,
      eventBus,
      stateManager,
      strategy,
      taskCount // Allow all to run at once
    );

    const startTime = performance.now();
    await executor.execute(steps);
    const endTime = performance.now();
    const duration = endTime - startTime;

    console.log(
      `\nWorkflowExecutor Benchmark (Concurrent N=${taskCount}): ${duration.toFixed(
        2
      )}ms`
    );
  }, 30000); // 30s timeout
});
