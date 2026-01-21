import { describe, it, expect } from "vitest";
import { WorkflowExecutor } from "../src/WorkflowExecutor.js";
import { EventBus } from "./../src/EventBus.js";
import { TaskStateManager } from "../src/TaskStateManager.js";
import { IExecutionStrategy } from "../src/strategies/IExecutionStrategy.js";
import { TaskStep } from "../src/TaskStep.js";
import { ExecutionConstants } from "../src/ExecutionConstants.js";

describe("WorkflowExecutor Strategy Failure Handling", () => {
  it("should handle execution strategy throwing an Error object", async () => {
    const eventBus = new EventBus<unknown>();
    const stateManager = new TaskStateManager(eventBus);

    const throwingStrategy: IExecutionStrategy<unknown> = {
      execute: async () => {
        throw new Error("Unexpected crash in strategy");
      }
    };

    const steps: TaskStep<unknown>[] = [
      {
        name: "A",
        run: async () => ({ status: "success" }),
      },
    ];

    const executor = new WorkflowExecutor({}, eventBus, stateManager, throwingStrategy);
    const results = await executor.execute(steps);
    const result = results.get("A");

    expect(result).toBeDefined();
    expect(result?.status).toBe("failure");
    expect(result?.message).toBe(ExecutionConstants.EXECUTION_STRATEGY_FAILED);
    expect(result?.error).toBe("Unexpected crash in strategy");
  });

  it("should handle execution strategy throwing a non-Error object", async () => {
    const eventBus = new EventBus<unknown>();
    const stateManager = new TaskStateManager(eventBus);

    const throwingStrategy: IExecutionStrategy<unknown> = {
      execute: async () => {
        throw "Critical failure string";
      }
    };

    const steps: TaskStep<unknown>[] = [
      {
        name: "B",
        run: async () => ({ status: "success" }),
      },
    ];

    const executor = new WorkflowExecutor({}, eventBus, stateManager, throwingStrategy);
    const results = await executor.execute(steps);
    const result = results.get("B");

    expect(result).toBeDefined();
    expect(result?.status).toBe("failure");
    expect(result?.message).toBe(ExecutionConstants.EXECUTION_STRATEGY_FAILED);
    expect(result?.error).toBe("Critical failure string");
  });
});
