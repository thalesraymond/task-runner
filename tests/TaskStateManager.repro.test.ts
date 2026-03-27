import { describe, it, expect, vi } from "vitest";
import { TaskStateManager } from "../src/TaskStateManager.js";
import { EventBus } from "../src/EventBus.js";
import { TaskStep } from "../src/TaskStep.js";

describe("TaskStateManager Repro", () => {
  it("should emit taskEnd event when cancelling pending tasks", () => {
    const eventBus = new EventBus<unknown>();
    const emitSpy = vi.spyOn(eventBus, "emit");
    const manager = new TaskStateManager(eventBus);

    const step: TaskStep<unknown> = { name: "step1", run: async () => ({ status: "success" }) };
    manager.initialize([step]);

    manager.cancelAllPending("Cancelled by user");

    expect(emitSpy).toHaveBeenCalledWith("taskEnd", expect.objectContaining({
      step,
      result: expect.objectContaining({ status: "cancelled", message: "Cancelled by user" })
    }));
  });

  it("should trigger 'always' dependent tasks when a task fails", () => {
    const eventBus = new EventBus<unknown>();
    const manager = new TaskStateManager(eventBus);

    const step1: TaskStep<unknown> = { name: "step1", run: async () => ({ status: "failure" }) };
    const step2: TaskStep<unknown> = {
      name: "step2",
      dependencies: [{ step: "step1", runCondition: "always" }],
      run: async () => ({ status: "success" })
    };
    manager.initialize([step1, step2]);

    const readySteps = manager.processDependencies();
    expect(readySteps.length).toBe(1);
    expect(readySteps[0].name).toBe("step1");

    manager.markRunning(step1);
    manager.markCompleted(step1, { status: "failure", error: "Fail" });

    const newReady = manager.processDependencies();
    expect(newReady.length).toBe(1);
    expect(newReady[0].name).toBe("step2");
  });

  it("should not ready an 'always' dependent task if it is no longer pending", () => {
    const eventBus = new EventBus<unknown>();
    const manager = new TaskStateManager(eventBus);

    const step1: TaskStep<unknown> = { name: "step1", run: async () => ({ status: "failure" }) };
    const step2: TaskStep<unknown> = {
      name: "step2",
      dependencies: [{ step: "step1", runCondition: "always" }],
      run: async () => ({ status: "success" })
    };
    const step3: TaskStep<unknown> = {
      name: "step3",
      dependencies: [{ step: "step1", runCondition: "success" }],
      run: async () => ({ status: "success" })
    };

    manager.initialize([step1, step2, step3]);

    // step1 is ready, so processDependencies moves it out of pending. step2 remains pending.
    manager.processDependencies();

    // Cancel step2 and step3
    manager.cancelAllPending("cancelled");

    manager.markRunning(step1);
    manager.markCompleted(step1, { status: "failure" });

    // step2's dependency is met, but it should not become ready because it was cancelled and is no longer pending.
    const newReady = manager.processDependencies();
    expect(newReady.length).toBe(0);
  });

  it("should skip 'always' dependent tasks when a task is skipped", () => {
    const eventBus = new EventBus<unknown>();
    const manager = new TaskStateManager(eventBus);

    const step1: TaskStep<unknown> = { name: "step1", run: async () => ({ status: "failure" }) };
    const step2: TaskStep<unknown> = {
      name: "step2",
      dependencies: ["step1"],
      run: async () => ({ status: "success" })
    };
    const step3: TaskStep<unknown> = {
      name: "step3",
      dependencies: [{ step: "step2", runCondition: "always" }],
      run: async () => ({ status: "success" })
    };

    manager.initialize([step1, step2, step3]);
    manager.processDependencies(); // pop step1

    manager.markRunning(step1);
    // Step 1 fails, so Step 2 should be skipped
    manager.markCompleted(step1, { status: "failure" });

    // Step 2 is skipped. Step 3 depends on Step 2 ('always').
    // Since Step 2 was SKIPPED, Step 3 should ALSO be skipped.
    const results = manager.getResults();
    expect(results.get("step2")?.status).toBe("skipped");
    expect(results.get("step3")?.status).toBe("skipped");

    const newReady = manager.processDependencies();
    expect(newReady.length).toBe(0);
  });
});
