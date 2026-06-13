import { describe, it, expect } from "vitest";
import { WorkflowExecutor } from "../src/WorkflowExecutor.js";
import { EventBus } from "../src/EventBus.js";
import { TaskStateManager } from "../src/TaskStateManager.js";
import { StandardExecutionStrategy } from "../src/strategies/StandardExecutionStrategy.js";
import { TaskStep } from "../src/TaskStep.js";

describe("WorkflowExecutor Conditional Abort", () => {
  it("covers aborted signal during executeTaskStep condition", async () => {
    const eventBus = new EventBus<unknown>();
    const stateManager = new TaskStateManager(eventBus);
    const strategy = new StandardExecutionStrategy();

    const controller = new AbortController();

    const steps: TaskStep<unknown>[] = [
      {
        name: "A",
        run: async () => {
          controller.abort();
          return { status: "success" };
        }
      },
      {
        name: "B",
        run: async () => ({ status: "success" })
      }
    ];

    const executor = new WorkflowExecutor({}, eventBus, stateManager, strategy, 1);
    const result = await executor.execute(steps, controller.signal);

    expect(result.get("B")?.status).toBe("cancelled");
  });

  it("covers aborted signal inside evaluateCondition when condition is async", async () => {
    const eventBus = new EventBus<unknown>();
    const stateManager = new TaskStateManager(eventBus);
    const strategy = new StandardExecutionStrategy();

    const controller = new AbortController();

    const steps: TaskStep<unknown>[] = [
      {
        name: "A",
        condition: async () => {
          controller.abort();
          return true;
        },
        run: async () => ({ status: "success" })
      }
    ];

    const executor = new WorkflowExecutor({}, eventBus, stateManager, strategy);
    const result = await executor.execute(steps, controller.signal);

    expect(result.get("A")?.status).toBe("cancelled");
    expect(result.get("A")?.message).toBe("Cancelled during condition evaluation.");
  });
});
