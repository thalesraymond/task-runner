import { describe, it, expect } from "vitest";
import { TaskStateManager } from "../src/TaskStateManager.js";
import { EventBus } from "../src/EventBus.js";
import { TaskStep } from "../src/TaskStep.js";

describe("TaskStateManager", () => {
  it("should correctly report running and pending tasks", () => {
    const eventBus = new EventBus<unknown>();
    const manager = new TaskStateManager(eventBus);

    const steps: TaskStep<unknown>[] = [
      { name: "A", run: async () => ({ status: "success" }) },
      { name: "B", run: async () => ({ status: "success" }) },
    ];

    manager.initialize(steps);

    expect(manager.hasPendingTasks()).toBe(true);
    expect(manager.hasRunningTasks()).toBe(false);

    // Simulate task A running
    const [stepA] = steps;
    manager.markRunning(stepA);

    expect(manager.hasRunningTasks()).toBe(true);

    // Simulate task A completing
    manager.markCompleted(stepA, { status: "success" });

    expect(manager.hasRunningTasks()).toBe(false);

    // Task B is still pending (in pendingSteps set)
    expect(manager.hasPendingTasks()).toBe(true);

    // Process dependencies to move pending to ready/removed
    manager.processDependencies();

    // A is done, B is ready. processDependencies clears pendingSteps for processed tasks?
    // Let's check implementation.
    // processDependencies iterates pendingSteps.
    // If ready, it adds to toRemove and then deletes from pendingSteps.

    // So if B is independent (implied), it is ready.
    expect(manager.hasPendingTasks()).toBe(false);
  });
});
