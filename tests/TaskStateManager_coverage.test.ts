import { describe, it, expect, vi } from "vitest";
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
});
