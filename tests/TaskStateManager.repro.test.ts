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
    const step3: TaskStep<unknown> = {
      name: "step3",
      dependencies: [{ step: "step1", runCondition: "always" }],
      run: async () => ({ status: "success" })
    };
    // Force step3 to be processed from pending but already complete? Wait, no.
    // The missing branch coverage for line 69, 244 in TaskStateManager is likely
    // `dep.runCondition ?? "success"` (line 69) and `if (newCount === 0 && this.pendingSteps.has(dependent))` (line 244)
    manager.initialize([step1, step2, step3]);

    // artificially remove step3 from pendingSteps to trigger line 244 branch
    // manager doesn't expose this, so we simulate a manual task removal or a canceled task
    manager.cancelAllPending("cancel");
    manager.initialize([step1, step2]); // Re-init correctly for normal flow

    const readySteps = manager.processDependencies();
    expect(readySteps.length).toBe(1);
    expect(readySteps[0].name).toBe("step1");

    manager.markRunning(step1);
    manager.markCompleted(step1, { status: "failure", error: "Fail" });

    const newReady = manager.processDependencies();
    expect(newReady.length).toBe(1);
    expect(newReady[0].name).toBe("step2");
  });

  it("should cover edge cases in dependencies and cascade", () => {
    const eventBus = new EventBus<unknown>();
    const manager = new TaskStateManager(eventBus);

    const step1: TaskStep<unknown> = { name: "step1", run: async () => ({ status: "failure" }) };
    const step2: TaskStep<unknown> = {
      name: "step2",
      dependencies: [{ step: "step1" }], // runCondition implicitly success
      run: async () => ({ status: "success" })
    };
    const step3: TaskStep<unknown> = {
      name: "step3",
      dependencies: [{ step: "step1", runCondition: "always" }, { step: "step2" }],
      run: async () => ({ status: "success" })
    };

    manager.initialize([step1, step2, step3]);

    // Simulate step3 is NOT in pendingSteps but has its count reduced to 0
    manager.cancelAllPending("test");
    manager.initialize([step1, step2, step3]);

    // Actually we can just run a scenario where an 'always' dependency is triggered
    // but the dependent is already cancelled.
    manager.processDependencies(); // gets step1
    manager.markRunning(step1);

    // cancel remaining pending steps (step2, step3)
    manager.cancelAllPending("canceled before failure");

    // now complete step1
    manager.markCompleted(step1, { status: "failure" });

    // this will hit line 244 because step3 count hits 0 (wait it depends on step2 as well)
    // Actually just a simple setup where it's cancelled
    expect(manager.processDependencies().length).toBe(0);
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
