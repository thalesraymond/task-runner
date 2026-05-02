import { describe, it, expect, vi } from "vitest";
import { TaskStateManager } from "../src/TaskStateManager.js";
import { EventBus } from "../src/EventBus.js";
import { TaskStep } from "../src/TaskStep.js";

describe("TaskStateManager Mutants", () => {
  it("should return true for hasPendingTasks when there are pending tasks and false after they are processed", () => {
    const eventBus = new EventBus<void>();
    const stateManager = new TaskStateManager<void>(eventBus);
    const step: TaskStep<void> = { name: "Step1", run: async () => ({ status: "success" }) };

    stateManager.initialize([step]);
    expect(stateManager.hasPendingTasks()).toBe(true);

    const ready = stateManager.processDependencies();
    expect(ready).toHaveLength(1);

    expect(stateManager.hasPendingTasks()).toBe(false);
  });

  it("should return true for hasRunningTasks when a task is running", () => {
    const eventBus = new EventBus<void>();
    const stateManager = new TaskStateManager<void>(eventBus);
    const step: TaskStep<void> = { name: "Step1", run: async () => ({ status: "success" }) };

    stateManager.initialize([step]);
    const ready = stateManager.processDependencies();

    stateManager.markRunning(ready[0]);
    expect(stateManager.hasRunningTasks()).toBe(true);

    stateManager.markCompleted(ready[0], { status: "success" });
    expect(stateManager.hasRunningTasks()).toBe(false);
  });

  it("should cascade failure to dependents if a task fails", () => {
    const eventBus = new EventBus<void>();
    const stateManager = new TaskStateManager<void>(eventBus);
    const stepA: TaskStep<void> = { name: "A", run: async () => ({ status: "failure" }) };
    const stepB: TaskStep<void> = { name: "B", dependencies: ["A"], run: async () => ({ status: "success" }) };

    stateManager.initialize([stepA, stepB]);

    const ready = stateManager.processDependencies();
    stateManager.markCompleted(ready[0], { status: "failure" });

    expect(stateManager.getResults().get("B")?.status).toBe("skipped");
  });

  it("should format depError with error message if available when cascading failure", () => {
    const eventBus = new EventBus<void>();
    const stateManager = new TaskStateManager<void>(eventBus);
    const stepA: TaskStep<void> = { name: "A", run: async () => ({ status: "failure" }) };
    const stepB: TaskStep<void> = { name: "B", dependencies: ["A"], run: async () => ({ status: "success" }) };

    stateManager.initialize([stepA, stepB]);
    const ready = stateManager.processDependencies();

    stateManager.markCompleted(ready[0], { status: "failure", error: "Something broke" });

    const resultB = stateManager.getResults().get("B");
    expect(resultB?.status).toBe("skipped");
    expect(resultB?.message).toBe("Skipped because dependency 'A' failed: Something broke");
  });

  it("should format depError without error message if error is missing when cascading failure", () => {
    const eventBus = new EventBus<void>();
    const stateManager = new TaskStateManager<void>(eventBus);
    const stepA: TaskStep<void> = { name: "A", run: async () => ({ status: "failure" }) };
    const stepB: TaskStep<void> = { name: "B", dependencies: ["A"], run: async () => ({ status: "success" }) };

    stateManager.initialize([stepA, stepB]);
    const ready = stateManager.processDependencies();

    stateManager.markCompleted(ready[0], { status: "failure" }); // No error

    const resultB = stateManager.getResults().get("B");
    expect(resultB?.status).toBe("skipped");
    expect(resultB?.message).toBe("Skipped because dependency 'A' failed");
  });

  it("should not mark dependent as ready if only one of its dependencies completed", () => {
    const eventBus = new EventBus<void>();
    const stateManager = new TaskStateManager<void>(eventBus);
    const stepA: TaskStep<void> = { name: "A", run: async () => ({ status: "success" }) };
    const stepB: TaskStep<void> = { name: "B", run: async () => ({ status: "success" }) };
    const stepC: TaskStep<void> = { name: "C", dependencies: ["A", "B"], run: async () => ({ status: "success" }) };

    stateManager.initialize([stepA, stepB, stepC]);

    const ready1 = stateManager.processDependencies(); // A and B
    expect(ready1).toHaveLength(2);

    stateManager.markCompleted(ready1[0].name === "A" ? ready1[0] : ready1[1], { status: "success" });

    const ready2 = stateManager.processDependencies();
    expect(ready2).toHaveLength(0);

    stateManager.markCompleted(ready1[0].name === "B" ? ready1[0] : ready1[1], { status: "success" });

    const ready3 = stateManager.processDependencies();
    expect(ready3).toHaveLength(1);
    expect(ready3[0].name).toBe("C");
  });

  it("should not handle success for cancelled task if continueOnError is true", () => {
    const eventBus = new EventBus<void>();
    const stateManager = new TaskStateManager<void>(eventBus);
    const stepA: TaskStep<void> = { name: "A", continueOnError: true, run: async () => ({ status: "cancelled" }) };
    const stepB: TaskStep<void> = { name: "B", dependencies: ["A"], run: async () => ({ status: "success" }) };

    stateManager.initialize([stepA, stepB]);
    const ready = stateManager.processDependencies();

    stateManager.markCompleted(ready[0], { status: "cancelled", message: "Cancelled" });

    expect(stateManager.getResults().get("B")?.status).toBe("skipped");
  });

  it("should return false if task already finished in internalMarkSkipped", () => {
    const eventBus = new EventBus<void>();
    const stateManager = new TaskStateManager<void>(eventBus);
    const step: TaskStep<void> = { name: "Step1", run: async () => ({ status: "success" }) };

    stateManager.initialize([step]);

    stateManager.markCompleted(step, { status: "success" });

    const spy = vi.spyOn(stateManager as unknown as { cascadeFailure: (failedStepName: string) => void }, "cascadeFailure");
    stateManager.markSkipped(step, { status: "skipped", message: "skipped" });

    expect(spy).not.toHaveBeenCalled();
  });

  it("should ignore internalMarkSkipped if step results already has it", () => {
    const eventBus = new EventBus<void>();
    const stateManager = new TaskStateManager<void>(eventBus);
    const step: TaskStep<void> = { name: "Step1", run: async () => ({ status: "success" }) };

    stateManager.initialize([step]);

    /* @ts-expect-error Bypass */
    expect(stateManager.internalMarkSkipped(step, { status: "skipped" })).toBe(true);
    /* @ts-expect-error Bypass */
    expect(stateManager.internalMarkSkipped(step, { status: "skipped" })).toBe(false);
  });

  it("should process cascadeFailure with multiple dependents correctly", () => {
    const eventBus = new EventBus<void>();
    const stateManager = new TaskStateManager<void>(eventBus);
    const stepA: TaskStep<void> = { name: "A", run: async () => ({ status: "failure" }) };
    const stepB: TaskStep<void> = { name: "B", dependencies: ["A"], run: async () => ({ status: "success" }) };
    const stepC: TaskStep<void> = { name: "C", dependencies: ["B"], run: async () => ({ status: "success" }) };

    stateManager.initialize([stepA, stepB, stepC]);

    const ready = stateManager.processDependencies();
    stateManager.markCompleted(ready[0], { status: "failure" });

    expect(stateManager.getResults().get("B")?.status).toBe("skipped");
    expect(stateManager.getResults().get("C")?.status).toBe("skipped");
  });

  it("should process dependencies efficiently without using readyQueue array declaration", () => {
      const eventBus = new EventBus<void>();
      const stateManager = new TaskStateManager<void>(eventBus);

      const ready = stateManager.processDependencies();
      expect(ready).toHaveLength(0);
      expect(ready).not.toContain("Stryker was here");
  });

  it("should format depError if error is available via optional chaining", () => {
      const eventBus = new EventBus<void>();
      const stateManager = new TaskStateManager<void>(eventBus);
      const stepA: TaskStep<void> = { name: "A", run: async () => ({ status: "failure" }) };
      const stepB: TaskStep<void> = { name: "B", dependencies: ["A"], run: async () => ({ status: "success" }) };

      stateManager.initialize([stepA, stepB]);
      const ready = stateManager.processDependencies();

      stateManager.markCompleted(ready[0], { status: "failure", error: "Broken" });
      const resultB = stateManager.getResults().get("B");
      expect(resultB?.message).toContain("Broken");
  });

  it("should check continueOnError when dependency fails without optional chaining", () => {
      const eventBus = new EventBus<void>();
      const stateManager = new TaskStateManager<void>(eventBus);
      const stepA: TaskStep<void> = { name: "A", continueOnError: true, run: async () => ({ status: "failure" }) };
      const stepB: TaskStep<void> = { name: "B", dependencies: ["A"], run: async () => ({ status: "success" }) };

      stateManager.initialize([stepA, stepB]);
      const ready = stateManager.processDependencies();

      stateManager.markCompleted(ready[0], { status: "failure" });

      const nextReady = stateManager.processDependencies();
      expect(nextReady[0].name).toBe("B");
  });

  it("should break out of loop correctly when head < queue.length", () => {
      const eventBus = new EventBus<void>();
      const stateManager = new TaskStateManager<void>(eventBus);
      const stepA: TaskStep<void> = { name: "A", run: async () => ({ status: "failure" }) };
      const stepB: TaskStep<void> = { name: "B", dependencies: ["A"], run: async () => ({ status: "success" }) };

      stateManager.initialize([stepA, stepB]);
      const ready = stateManager.processDependencies();

      const spy = vi.spyOn(stateManager as unknown as { internalMarkSkipped: (step: unknown, result: unknown) => boolean }, "internalMarkSkipped");
      stateManager.markCompleted(ready[0], { status: "failure" });

      expect(spy).toHaveBeenCalledTimes(1);
  });

  it("should fail gracefully when task missing from taskDefinitions on continueOnError check", () => {
      const eventBus = new EventBus<void>();
      const stateManager = new TaskStateManager<void>(eventBus);
      const stepA: TaskStep<void> = { name: "A", run: async () => ({ status: "failure" }) };

      stateManager.initialize([stepA]);
      const ready = stateManager.processDependencies();

      /* @ts-expect-error Bypass */
      stateManager.taskDefinitions.delete("A");

      stateManager.markCompleted(ready[0], { status: "failure" });

      expect(stateManager.getResults().get("A")?.status).toBe("failure");
  });
});
