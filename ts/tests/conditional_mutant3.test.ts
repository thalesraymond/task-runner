import { describe, it, expect } from "vitest";
import { WorkflowExecutor } from "../src/WorkflowExecutor.js";
import { EventBus } from "../src/EventBus.js";
import { TaskStateManager } from "../src/TaskStateManager.js";
import { StandardExecutionStrategy } from "../src/strategies/StandardExecutionStrategy.js";

describe("WorkflowExecutor Conditional Mutant 3", () => {
  it("kills if (conditionResult.status !== 'skipped') mutant on line 208", async () => {
    const eventBus = new EventBus<unknown>();
    const stateManager = new TaskStateManager(eventBus);
    const strategy = new StandardExecutionStrategy();

    let taskEndEmitted = false;
    let taskSkippedEmitted = false;

    eventBus.on("taskEnd", () => { taskEndEmitted = true; });
    eventBus.on("taskSkipped", () => { taskSkippedEmitted = true; });

    // A condition that evaluates to undefined (meaning it should run)
    // Wait, if it evaluates to undefined, we return undefined from evaluateCondition
    // and skip the whole if (conditionResult) block.
    // So we need a conditionResult that is NOT skipped, like "cancelled".
    const controller = new AbortController();
    const steps = [{
        name: "A",
        condition: () => true, // but abort
        run: async () => ({ status: "success" as const })
    }];

    const executor = new WorkflowExecutor({}, eventBus, stateManager, strategy);
    // Abort early so `evaluateCondition` returns { status: "cancelled" }
    controller.abort();
    await executor.execute(steps, controller.signal);

    // With `if (conditionResult.status === "skipped")`, this "cancelled" result goes to `markCompleted`, which emits "taskEnd".
    // If mutant `if (conditionResult.status !== "skipped")` is applied, it will erroneously go to `markSkipped` emitting "taskSkipped".

    expect(taskEndEmitted).toBe(true);
    expect(taskSkippedEmitted).toBe(false);
  });
});
