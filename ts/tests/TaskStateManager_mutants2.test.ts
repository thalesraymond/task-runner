import { describe, it, expect, vi } from "vitest";
import { TaskStateManager } from "../src/TaskStateManager.js";
import { EventBus } from "../src/EventBus.js";
import { TaskStep } from "../src/TaskStep.js";

describe("TaskStateManager cascaded failure mutants", () => {
    it("should format depError without error message if error is missing when cascading failure", () => {
        const eventBus = new EventBus<void>();
        const stateManager = new TaskStateManager<void>(eventBus);

        const step1: TaskStep<void> = { name: "Step1", run: async () => ({ status: "failure" }) };
        const step2: TaskStep<void> = { name: "Step2", run: async () => ({ status: "success" }), dependencies: ["Step1"] };

        stateManager.initialize([step1, step2]);
        const ready = stateManager.processDependencies();

        // This will trigger cascadeFailure inside markCompleted
        stateManager.markCompleted(ready[0], { status: "failure" }); // No error string

        const results = stateManager.getResults();
        expect(results.get("Step2")?.status).toBe("skipped");
        expect(results.get("Step2")?.message).toBe("Skipped because dependency 'Step1' failed");
    });

    it("should format depError with error message if available when cascading failure", () => {
        const eventBus = new EventBus<void>();
        const stateManager = new TaskStateManager<void>(eventBus);

        const step1: TaskStep<void> = { name: "Step1", run: async () => ({ status: "failure" }) };
        const step2: TaskStep<void> = { name: "Step2", run: async () => ({ status: "success" }), dependencies: ["Step1"] };

        stateManager.initialize([step1, step2]);
        const ready = stateManager.processDependencies();

        stateManager.markCompleted(ready[0], { status: "failure", error: "Boom" });

        const results = stateManager.getResults();
        expect(results.get("Step2")?.status).toBe("skipped");
        expect(results.get("Step2")?.message).toBe("Skipped because dependency 'Step1' failed: Boom");
    });


    it("should break out of while loop when head reaches queue length", () => {
        const eventBus = new EventBus<void>();
        const stateManager = new TaskStateManager<void>(eventBus);
        const step1: TaskStep<void> = { name: "Step1", run: async () => ({ status: "failure" }) };
        const step2: TaskStep<void> = { name: "Step2", run: async () => ({ status: "success" }), dependencies: ["Step1"] };
        stateManager.initialize([step1, step2]);

        const ready = stateManager.processDependencies();
        // Since dependencyGraph is initialized inside TaskStateManager, let's just spy on map.get
        // @ts-expect-error bypass private access
        const mapGetSpy = vi.spyOn(stateManager.dependencyGraph, "get");

        stateManager.markCompleted(ready[0], { status: "failure" });

        // If while loop had `head <= queue.length`, it would do map.get(undefined)
        expect(mapGetSpy).not.toHaveBeenCalledWith(undefined);
    });

  it("kills break out of loop mutant when head < queue.length", () => {
    const eventBus = new EventBus<void>();
    const stateManager = new TaskStateManager<void>(eventBus);

    // A fails -> B skips -> C skips.
    const stepA: TaskStep<void> = { name: "A", run: async () => ({ status: "failure" }) };
    const stepB: TaskStep<void> = { name: "B", dependencies: ["A"], run: async () => ({ status: "success" }) };
    const stepC: TaskStep<void> = { name: "C", dependencies: ["B"], run: async () => ({ status: "success" }) };

    stateManager.initialize([stepA, stepB, stepC]);
    const ready = stateManager.processDependencies();

    stateManager.markCompleted(ready[0], { status: "failure" });

    expect(stateManager.getResults().get("B")?.status).toBe("skipped");
    expect(stateManager.getResults().get("C")?.status).toBe("skipped");
  });
});
