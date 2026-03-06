import { describe, it, expect } from "vitest";
import { TaskStateManager } from "../src/TaskStateManager.js";
import { EventBus } from "../src/EventBus.js";
import { TaskStep } from "../src/TaskStep.js";

describe("TaskStateManager Coverage", () => {
  it("should queue dependent with 'always' runCondition when parent fails", () => {
    const eventBus = new EventBus<void>();
    const stateManager = new TaskStateManager<void>(eventBus);

    const stepA: TaskStep<void> = { name: "A", run: async () => ({ status: "failure" }) };
    const stepB: TaskStep<void> = {
      name: "B",
      dependencies: [{ step: "A", runCondition: "always" }],
      run: async () => ({ status: "success" })
    };
    const stepC: TaskStep<void> = {
      name: "C",
      dependencies: [{ step: "A" }], // Test defaulting runCondition to 'success'
      run: async () => ({ status: "success" })
    };

    stateManager.initialize([stepA, stepB, stepC]);

    const readyA = stateManager.processDependencies();
    expect(readyA).toHaveLength(1);
    expect(readyA[0].name).toBe("A");

    stateManager.markRunning(readyA[0]);
    stateManager.markCompleted(readyA[0], { status: "failure", error: "failed" });

    const readyB = stateManager.processDependencies();
    expect(readyB).toHaveLength(1);
    expect(readyB[0].name).toBe("B"); // C is skipped because default condition is success
  });

  it("should skip dependent with 'always' runCondition when parent is skip cascaded transitively", () => {
    const eventBus = new EventBus<void>();
    const stateManager = new TaskStateManager<void>(eventBus);

    // A(fail) -> B(success condition) -> C(always condition on B)
    // When A fails, B is skipped. Since B is skipped (not failed), C should also be skipped.
    const stepA: TaskStep<void> = { name: "A", run: async () => ({ status: "failure" }) };
    const stepB: TaskStep<void> = {
      name: "B",
      dependencies: ["A"],
      run: async () => ({ status: "success" })
    };
    const stepC: TaskStep<void> = {
      name: "C",
      dependencies: [{ step: "B", runCondition: "always" }],
      run: async () => ({ status: "success" })
    };

    stateManager.initialize([stepA, stepB, stepC]);

    const readyA = stateManager.processDependencies();
    stateManager.markRunning(readyA[0]);
    stateManager.markCompleted(readyA[0], { status: "failure", error: "A failed" });

    // Both B and C should be skipped
    expect(stateManager.getResults().get("B")?.status).toBe("skipped");
    expect(stateManager.getResults().get("B")?.message).toContain("failed: A failed");

    expect(stateManager.getResults().get("C")?.status).toBe("skipped");
    expect(stateManager.getResults().get("C")?.message).toContain("was skipped");

    const readyNext = stateManager.processDependencies();
    expect(readyNext).toHaveLength(0);
  });

  it("should skip dependent with 'always' runCondition when parent is skipped", () => {
    const eventBus = new EventBus<void>();
    const stateManager = new TaskStateManager<void>(eventBus);

    const stepA: TaskStep<void> = { name: "A", run: async () => ({ status: "success" }) };
    const stepB: TaskStep<void> = {
      name: "B",
      dependencies: [{ step: "A", runCondition: "always" }],
      run: async () => ({ status: "success" })
    };

    stateManager.initialize([stepA, stepB]);

    const readyA = stateManager.processDependencies();
    stateManager.markRunning(readyA[0]);

    // Mark A as skipped
    stateManager.markSkipped(readyA[0], { status: "skipped", message: "skipped A" });

    // B should be skipped
    expect(stateManager.getResults().get("B")?.status).toBe("skipped");
    expect(stateManager.getResults().get("B")?.message).toContain("was skipped");

    const readyB = stateManager.processDependencies();
    expect(readyB).toHaveLength(0);
  });

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
