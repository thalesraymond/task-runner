import { describe, it, expect } from "vitest";
import { WorkflowExecutor } from "../src/WorkflowExecutor.js";
import { EventBus } from "../src/EventBus.js";
import { TaskStep } from "../src/TaskStep.js";
import { TaskStateManager } from "../src/TaskStateManager.js";
import { StandardExecutionStrategy } from "../src/strategies/StandardExecutionStrategy.js";

describe("WorkflowExecutor", () => {
  it("should execute steps sequentially when dependencies exist", async () => {
    const eventBus = new EventBus<unknown>();
    const stateManager = new TaskStateManager(eventBus);
    const strategy = new StandardExecutionStrategy();

    const executionOrder: string[] = [];
    const steps: TaskStep<unknown>[] = [
      {
        name: "A",
        run: async () => {
          executionOrder.push("A");
          return { status: "success" };
        },
      },
      {
        name: "B",
        dependencies: ["A"],
        run: async () => {
          executionOrder.push("B");
          return { status: "success" };
        },
      },
    ];

    const executor = new WorkflowExecutor({}, eventBus, stateManager, strategy);
    const results = await executor.execute(steps);

    expect(executionOrder).toEqual(["A", "B"]);
    expect(results.get("A")?.status).toBe("success");
    expect(results.get("B")?.status).toBe("success");
  });

  it("should skip dependent steps if dependency fails", async () => {
    const eventBus = new EventBus<unknown>();
    const stateManager = new TaskStateManager(eventBus);
    const strategy = new StandardExecutionStrategy();

    const steps: TaskStep<unknown>[] = [
      {
        name: "A",
        run: async () => ({ status: "failure", error: "Failed" }),
      },
      {
        name: "B",
        dependencies: ["A"],
        run: async () => ({ status: "success" }),
      },
    ];

    const executor = new WorkflowExecutor({}, eventBus, stateManager, strategy);
    const results = await executor.execute(steps);

    expect(results.get("A")?.status).toBe("failure");
    expect(results.get("B")?.status).toBe("skipped");
  });

  it("should run independent steps in parallel", async () => {
    const eventBus = new EventBus<unknown>();
    const stateManager = new TaskStateManager(eventBus);
    const strategy = new StandardExecutionStrategy();

    const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));
    const steps: TaskStep<unknown>[] = [
      {
        name: "A",
        run: async () => {
          await delay(50);
          return { status: "success" };
        },
      },
      {
        name: "B",
        run: async () => {
          await delay(50);
          return { status: "success" };
        },
      },
    ];

    const executor = new WorkflowExecutor({}, eventBus, stateManager, strategy);
    const start = Date.now();
    await executor.execute(steps);
    const duration = Date.now() - start;

    // Should be closer to 50ms than 100ms
    expect(duration).toBeLessThan(90);
  });
});
