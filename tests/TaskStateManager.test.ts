import { describe, it, expect, beforeEach } from "vitest";
import { TaskStateManager } from "../src/TaskStateManager.js";
import { TaskStep } from "../src/TaskStep.js";
import { EventBus } from "../src/EventBus.js";

describe("TaskStateManager", () => {
  let eventBus: EventBus<unknown>;
  let stateManager: TaskStateManager<unknown>;

  beforeEach(() => {
    eventBus = new EventBus();
    stateManager = new TaskStateManager(eventBus);
  });

  it("should initialize with mixed dependency types and run tasks with 'success' condition", () => {
    const steps: TaskStep<unknown>[] = [
      { name: "A", run: async () => ({ status: "success" }) },
      { name: "B", dependencies: ["A"], run: async () => ({ status: "success" }) },
      { name: "C", dependencies: [{ step: "A", runCondition: "always" }], run: async () => ({ status: "success" }) },
    ];

    stateManager.initialize(steps);
    const ready = stateManager.processDependencies();
    expect(ready.map(t => t.name)).toEqual(["A"]);
    expect(stateManager.hasPendingTasks()).toBe(true);
  });

  it("should propagate failure normally to dependent with 'success' condition", () => {
    const steps: TaskStep<unknown>[] = [
      { name: "A", run: async () => ({ status: "success" }) },
      { name: "B", dependencies: ["A"], run: async () => ({ status: "success" }) }
    ];

    stateManager.initialize(steps);
    stateManager.processDependencies(); // A is ready

    stateManager.markRunning(steps[0]);
    stateManager.markCompleted(steps[0], { status: "failure", error: "Failed" });

    const results = stateManager.getResults();
    expect(results.get("A")?.status).toBe("failure");
    expect(results.get("B")?.status).toBe("skipped");
  });

  it("should NOT propagate failure to dependent with 'always' condition", () => {
    const steps: TaskStep<unknown>[] = [
      { name: "A", run: async () => ({ status: "success" }) },
      { name: "B", dependencies: [{ step: "A", runCondition: "always" }], run: async () => ({ status: "success" }) }
    ];

    stateManager.initialize(steps);
    stateManager.processDependencies(); // A is ready

    stateManager.markRunning(steps[0]);
    stateManager.markCompleted(steps[0], { status: "failure", error: "Failed" });

    const readyAfterA = stateManager.processDependencies();
    expect(readyAfterA.map(t => t.name)).toEqual(["B"]);
  });

  it("should propagate SKIP to dependent with 'always' condition (because parent never ran)", () => {
    const steps: TaskStep<unknown>[] = [
      { name: "X", run: async () => ({ status: "success" }) },
      { name: "A", dependencies: ["X"], run: async () => ({ status: "success" }) },
      { name: "B", dependencies: [{ step: "A", runCondition: "always" }], run: async () => ({ status: "success" }) }
    ];

    stateManager.initialize(steps);
    stateManager.processDependencies(); // X is ready

    stateManager.markRunning(steps[0]);
    stateManager.markCompleted(steps[0], { status: "failure", error: "Failed X" });

    const results = stateManager.getResults();
    expect(results.get("X")?.status).toBe("failure");
    expect(results.get("A")?.status).toBe("skipped");
    expect(results.get("B")?.status).toBe("skipped");
  });
});
