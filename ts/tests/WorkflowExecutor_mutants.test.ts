import { describe, it, expect, vi } from "vitest";
import { WorkflowExecutor } from "../src/WorkflowExecutor.js";
import { EventBus } from "../src/EventBus.js";
import { TaskStep } from "../src/TaskStep.js";
import { TaskStateManager } from "../src/TaskStateManager.js";
import { StandardExecutionStrategy } from "../src/strategies/StandardExecutionStrategy.js";

describe("WorkflowExecutor Mutants", () => {
  it("should ignore abort event if no abort signal is provided in finally block", async () => {
    const eventBus = new EventBus<void>();
    const stateManager = new TaskStateManager<void>(eventBus);
    const strategy = new StandardExecutionStrategy<void>();
    const executor = new WorkflowExecutor<void>(undefined as unknown as void, eventBus, stateManager, strategy);

    const step: TaskStep<void> = { name: "Step1", run: async () => ({ status: "success" }) };

    const results = await executor.execute([step]);
    expect(results.get("Step1")?.status).toBe("success");
  });

  it("should remove abort event listener in finally block", async () => {
    const eventBus = new EventBus<void>();
    const stateManager = new TaskStateManager<void>(eventBus);
    const strategy = new StandardExecutionStrategy<void>();
    const executor = new WorkflowExecutor<void>(undefined as unknown as void, eventBus, stateManager, strategy);

    const step: TaskStep<void> = { name: "Step1", run: async () => ({ status: "success" }) };

    const controller = new AbortController();
    const removeSpy = vi.spyOn(controller.signal, "removeEventListener");

    await executor.execute([step], controller.signal);

    expect(removeSpy).toHaveBeenCalledWith("abort", expect.any(Function));
  });

  it("should not call removeEventListener with empty string", async () => {
    const eventBus = new EventBus<void>();
    const stateManager = new TaskStateManager<void>(eventBus);
    const strategy = new StandardExecutionStrategy<void>();
    const executor = new WorkflowExecutor<void>(undefined as unknown as void, eventBus, stateManager, strategy);

    const step: TaskStep<void> = { name: "Step1", run: async () => ({ status: "success" }) };

    const controller = new AbortController();
    const removeSpy = vi.spyOn(controller.signal, "removeEventListener");

    await executor.execute([step], controller.signal);

    expect(removeSpy).not.toHaveBeenCalledWith("", expect.any(Function));
  });

  it("should clear readyQueue properly during cancelAllPending", () => {
      const eventBus = new EventBus<void>();
      const stateManager = new TaskStateManager<void>(eventBus);
      const step: TaskStep<void> = { name: "Step1", run: async () => ({ status: "success" }) };

      stateManager.initialize([step]);
      stateManager.cancelAllPending("cancelled");

      const ready = stateManager.processDependencies();
      expect(ready).toHaveLength(0);
  });
});
