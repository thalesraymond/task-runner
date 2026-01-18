import { describe, it, expect, vi } from "vitest";
import { WorkflowExecutor } from "../src/WorkflowExecutor.js";
import { EventBus } from "../src/EventBus.js";
import { TaskStep } from "../src/TaskStep.js";
import { TaskStateManager } from "../src/TaskStateManager.js";
import { StandardExecutionStrategy } from "../src/strategies/StandardExecutionStrategy.js";

describe("WorkflowExecutor", () => {
  it("should prevent duplicate task execution when queued tasks are rediscovered", async () => {
    const eventBus = new EventBus<unknown>();
    const stateManager = new TaskStateManager(eventBus);
    const strategy = new StandardExecutionStrategy();
    const context = {};

    const t1: TaskStep<unknown> = { name: "t1", run: async () => ({ status: "success" }) };
    const t2: TaskStep<unknown> = { name: "t2", run: async () => ({ status: "success" }) };
    const t3: TaskStep<unknown> = { name: "t3", run: async () => ({ status: "success" }) };

    // Sequence to simulate:
    // 1. Initial: [t1] ready. t1 runs.
    // 2. t1 finishes. [t2, t3] ready. t2 runs. t3 queued.
    // 3. t2 finishes. [t3] ready (rediscovered!). t3 should be deduped. t3 runs.
    // 4. t3 finishes. [] ready. Stop.

    vi.spyOn(stateManager, "initialize").mockImplementation(() => {});
    const pendingSpy = vi.spyOn(stateManager, "hasPendingTasks");
    // Initial check (loop start) -> true
    // After t1 -> true
    // After t2 -> true
    // After t3 -> false (loop end)

    vi.spyOn(stateManager, "hasRunningTasks").mockReturnValue(false);

    vi.spyOn(stateManager, "processDependencies")
      .mockReturnValueOnce([t1])      // Initial
      .mockReturnValueOnce([t2, t3])  // After t1
      .mockReturnValueOnce([t3])      // After t2 (t3 is the duplicate)
      .mockReturnValue([]);           // After t3

    const executeSpy = vi.spyOn(strategy, "execute").mockResolvedValue({ status: "success" });
    vi.spyOn(stateManager, "markCompleted").mockImplementation(() => {});

    // Fix hasPendingTasks to return false eventually
    pendingSpy.mockReturnValueOnce(true) // Initial
              .mockReturnValueOnce(true) // Loop 1 (t1 running)
              .mockReturnValueOnce(true) // Loop 2 (t2 running)
              .mockReturnValueOnce(true) // Loop 3 (t3 running)
              .mockReturnValue(false);   // End

    const executor = new WorkflowExecutor(context, eventBus, stateManager, strategy, 1);

    await executor.execute([t1, t2, t3]);

    // t1, t2, t3 should run exactly once
    expect(executeSpy).toHaveBeenCalledTimes(3);
    // Use specific checks or simpler assertions
    const calls = executeSpy.mock.calls;
    expect(calls[0][0]).toEqual(t1);
    expect(calls[1][0]).toEqual(t2);
    expect(calls[2][0]).toEqual(t3);
  });

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
