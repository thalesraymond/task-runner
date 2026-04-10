import { describe, it, expect } from "vitest";
import { TaskStateManager } from "../src/TaskStateManager.js";
import { EventBus } from "../src/EventBus.js";
import { TaskStep } from "../src/TaskStep.js";

describe("TaskStateManager Coverage", () => {
  it("should handle leaf task failure gracefully", () => {
    const eventBus = new EventBus<void>();
    const stateManager = new TaskStateManager<void>(eventBus);
    const step: TaskStep<void> = { name: "Leaf", run: async () => ({ status: "failure" }) };
    stateManager.initialize([step]);

    const ready = stateManager.processDependencies();
    expect(ready).toHaveLength(1);

    stateManager.markRunning(ready[0]);
    // This task has no dependents. cascadeFailure should hit the "!dependents" check.
    stateManager.markCompleted(ready[0], { status: "failure", error: "oops" });

    expect(stateManager.getResults().get("Leaf")?.status).toBe("failure");
  });

  it("should ignore markSkipped if task already finished", () => {
    const eventBus = new EventBus<void>();
    const stateManager = new TaskStateManager<void>(eventBus);
    const step: TaskStep<void> = { name: "A", run: async () => ({ status: "skipped" }) };
    stateManager.initialize([step]);

    const ready = stateManager.processDependencies();
    stateManager.markRunning(ready[0]);

    const result = { status: "skipped" as const, message: "skip1" };
    stateManager.markSkipped(ready[0], result);

    // Call again - should be ignored (return false from internalMarkSkipped)
    stateManager.markSkipped(ready[0], { status: "skipped", message: "skip2" });

    expect(stateManager.getResults().get("A")?.message).toBe("skip1");
  });

  it("should not queue dependent if it is no longer pending", () => {
    const eventBus = new EventBus<void>();
    const stateManager = new TaskStateManager<void>(eventBus);

    const stepA: TaskStep<void> = { name: "A", run: async () => ({ status: "success" }) };
    const stepB: TaskStep<void> = { name: "B", dependencies: ["A"], run: async () => ({ status: "success" }) };

    stateManager.initialize([stepA, stepB]);

    const ready = stateManager.processDependencies(); // Returns A
    expect(ready).toHaveLength(1);
    expect(ready[0].name).toBe("A");

    stateManager.markRunning(ready[0]);

    // Manually remove B from pending (simulate cancellation or other removal)
    // We can use cancelAllPending
    stateManager.cancelAllPending("cancelled");

    // Now finish A
    stateManager.markCompleted(ready[0], { status: "success" });

    // processDependencies should return empty because B was cancelled/removed
    const nextReady = stateManager.processDependencies();
    expect(nextReady).toHaveLength(0);

    expect(stateManager.getResults().get("B")?.status).toBe("cancelled");
  });
  it("should push 'always' dependent to readyQueue when dependency fails", () => {
    const eventBus = new EventBus<void>();
    const stateManager = new TaskStateManager<void>(eventBus);

    const stepA: TaskStep<void> = { name: "A", run: async () => ({ status: "failure" }) };
    const stepB: TaskStep<void> = { name: "B", dependencies: [{ step: "A", runCondition: "always" }], run: async () => ({ status: "success" }) };

    stateManager.initialize([stepA, stepB]);

    const readyA = stateManager.processDependencies();
    expect(readyA).toHaveLength(1);
    expect(readyA[0].name).toBe("A");

    stateManager.markRunning(readyA[0]);
    stateManager.markCompleted(readyA[0], { status: "failure", error: "failed A" });

    // B should be queued because of 'always' condition despite A failing
    const readyB = stateManager.processDependencies();
    expect(readyB).toHaveLength(1);
    expect(readyB[0].name).toBe("B");
  });

  it("should skip 'always' dependent if dependency is skipped", () => {
    const eventBus = new EventBus<void>();
    const stateManager = new TaskStateManager<void>(eventBus);

    const stepX: TaskStep<void> = { name: "X", run: async () => ({ status: "failure" }) };
    const stepA: TaskStep<void> = { name: "A", dependencies: ["X"], run: async () => ({ status: "success" }) };
    const stepB: TaskStep<void> = { name: "B", dependencies: [{ step: "A", runCondition: "always" }], run: async () => ({ status: "success" }) };

    stateManager.initialize([stepX, stepA, stepB]);

    const readyX = stateManager.processDependencies();
    expect(readyX).toHaveLength(1);

    stateManager.markRunning(readyX[0]);
    stateManager.markCompleted(readyX[0], { status: "failure" }); // X fails -> A skips

    // processDependencies should be empty because A is skipped, and B is skipped too
    const readyB = stateManager.processDependencies();
    expect(readyB).toHaveLength(0);

    expect(stateManager.getResults().get("A")?.status).toBe("skipped");
    expect(stateManager.getResults().get("B")?.status).toBe("skipped");
  });

  it("should handle default runCondition when TaskDependencyConfig omits it", () => {
    const eventBus = new EventBus<void>();
    const stateManager = new TaskStateManager<void>(eventBus);

    const stepA: TaskStep<void> = { name: "A", run: async () => ({ status: "failure" }) };
    const stepB: TaskStep<void> = { name: "B", dependencies: [{ step: "A" }], run: async () => ({ status: "success" }) };

    stateManager.initialize([stepA, stepB]);

    const readyA = stateManager.processDependencies();
    stateManager.markRunning(readyA[0]);
    stateManager.markCompleted(readyA[0], { status: "failure" });

    // B should be skipped because it defaults to 'success'
    const readyB = stateManager.processDependencies();
    expect(readyB).toHaveLength(0);
    expect(stateManager.getResults().get("B")?.status).toBe("skipped");
  });
});
