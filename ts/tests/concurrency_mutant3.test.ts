import { describe, it, expect } from "vitest";
import { WorkflowExecutor } from "../src/WorkflowExecutor.js";
import { EventBus } from "../src/EventBus.js";
import { TaskStateManager } from "../src/TaskStateManager.js";
import { StandardExecutionStrategy } from "../src/strategies/StandardExecutionStrategy.js";

describe("WorkflowExecutor Concurrency Mutant 3", () => {
  it("kills true && mutant on line 136", async () => {
    const eventBus = new EventBus<unknown>();
    const stateManager = new TaskStateManager(eventBus);
    const strategy = new StandardExecutionStrategy();

    // We can pass `null` or `false` or something using `as unknown as number` to test if it explicitly checks for number?
    // The mutator changes `typeof this.concurrency === "number"` to `true`.
    // If we pass an object like `{}` for concurrency (as unknown as number), `size >= {}` is false.
    // What if we pass `0`?
    // If we pass `"0"` (as unknown as number), `typeof this.concurrency === "number"` is false.
    // So it skips the break condition and executes tasks.
    // But with the mutant `true && executingPromises.size >= "0"`, it would evaluate to `true` and break!

    const executor = new WorkflowExecutor({}, eventBus, stateManager, strategy, "0" as unknown as number);

    const steps = [{
      name: "A",
      run: async () => ({ status: "success" as const })
    }];

    const result = await executor.execute(steps);
    // If mutant `true &&` is alive, it breaks loop and task A never runs, so it finishes empty.
    // If our code `typeof this.concurrency === "number"` is correct, it evaluates to false and runs A.
    expect(result.get("A")?.status).toBe("success");
  });
});
