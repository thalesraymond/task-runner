import { describe, it, expect } from "vitest";
import { DryRunExecutionStrategy } from "../src/strategies/DryRunExecutionStrategy.js";
import { TaskStep } from "../src/TaskStep.js";

describe("DryRunExecutionStrategy", () => {
  it("should return success without running the task", async () => {
    const strategy = new DryRunExecutionStrategy();
    const step: TaskStep<unknown> = {
      name: "test-task",
      run: async () => {
        throw new Error("Should not run");
      },
    };

    const result = await strategy.execute(step, {});

    expect(result).toStrictEqual({
      status: "success",
      message: "Dry run: simulated success test-task",
    });
  });
});
