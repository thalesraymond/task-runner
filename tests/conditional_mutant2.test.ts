import { describe, it, expect } from "vitest";
import { WorkflowExecutor } from "../src/WorkflowExecutor.js";
import { EventBus } from "../src/EventBus.js";
import { TaskStateManager } from "../src/TaskStateManager.js";
import { StandardExecutionStrategy } from "../src/strategies/StandardExecutionStrategy.js";

describe("WorkflowExecutor Conditional Mutant 2", () => {
  it("kills if (false) and status === '' mutants on line 208", async () => {
    const eventBus = new EventBus<unknown>();
    const stateManager = new TaskStateManager(eventBus);
    const strategy = new StandardExecutionStrategy();

    let taskEndEmitted = false;
    let taskSkippedEmitted = false;

    eventBus.on("taskEnd", () => { taskEndEmitted = true; });
    eventBus.on("taskSkipped", () => { taskSkippedEmitted = true; });

    // A condition that returns false evaluates to "skipped"
    const steps = [{
        name: "A",
        condition: () => false,
        run: async () => ({ status: "success" as const })
    }];

    const executor = new WorkflowExecutor({}, eventBus, stateManager, strategy);
    await executor.execute(steps);

    // With `if (conditionResult.status === "skipped")`, this skipped result goes to `markSkipped`, emitting "taskSkipped".
    // If mutant `if (false)` or `if (conditionResult.status === "")` is applied, it will erroneously go to `markCompleted` emitting "taskEnd".
    expect(taskSkippedEmitted).toBe(true);
    expect(taskEndEmitted).toBe(false);
  });
});
