import { describe, it, expect } from "vitest";
import { WorkflowExecutor } from "../src/WorkflowExecutor.js";
import { EventBus } from "../src/EventBus.js";
import { TaskStateManager } from "../src/TaskStateManager.js";
import { StandardExecutionStrategy } from "../src/strategies/StandardExecutionStrategy.js";

describe("WorkflowExecutor Conditional Mutant", () => {
  it("kills true and false mutants on line 208", async () => {
    const eventBus = new EventBus<unknown>();
    const stateManager = new TaskStateManager(eventBus);
    const strategy = new StandardExecutionStrategy();

    let taskEndEmitted = false;
    let taskSkippedEmitted = false;

    eventBus.on("taskEnd", () => { taskEndEmitted = true; });
    eventBus.on("taskSkipped", () => { taskSkippedEmitted = true; });

    // A condition that throws an error evaluates to "failure"
    const steps = [{
        name: "A",
        condition: () => { throw new Error("Oops"); },
        run: async () => ({ status: "success" as const })
    }];

    const executor = new WorkflowExecutor({}, eventBus, stateManager, strategy);
    await executor.execute(steps);

    // With `if (conditionResult.status === "skipped")`, this failure result goes to `markCompleted`, which emits "taskEnd"
    // If mutant `if (true)` is applied, it goes to `markSkipped`, which emits "taskSkipped".

    expect(taskEndEmitted).toBe(true);
    expect(taskSkippedEmitted).toBe(false);
  });
});
