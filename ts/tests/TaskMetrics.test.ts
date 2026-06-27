import { describe, it, expect } from "vitest";
import { TaskRunner } from "../src/TaskRunner.js";
import { TaskStep } from "../src/TaskStep.js";

describe("Task Execution Metrics", () => {
  it("should capture metrics for a successful task", async () => {
    const delayMs = 50;
    const steps: TaskStep<unknown>[] = [
      {
        name: "TestTask",
        run: async () => {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          return { status: "success" };
        },
      },
    ];

    const runner = new TaskRunner({});
    const start = performance.now();
    const results = await runner.execute(steps);
    const end = performance.now();
    const result = results.get("TestTask");

    // Allow some small flexibility for measurement diffs
    expect(result).toBeDefined();
    expect(result?.metrics).toBeDefined();
    expect(result?.metrics?.startTime).toBeGreaterThanOrEqual(start);
    expect(result?.metrics?.endTime).toBeLessThanOrEqual(end);
    expect(result?.metrics?.duration).toBeGreaterThanOrEqual(delayMs - 5);
    // Allow some buffer for execution overhead
    expect(result?.metrics?.duration).toBeLessThan(delayMs + 200);
  });

  it("should capture metrics for a failed task", async () => {
    const delayMs = 30;
    const steps: TaskStep<unknown>[] = [
      {
        name: "FailedTask",
        run: async () => {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          throw new Error("Task failed");
        },
      },
    ];

    const runner = new TaskRunner({});
    const results = await runner.execute(steps);
    const result = results.get("FailedTask");

    expect(result).toBeDefined();
    expect(result?.status).toBe("failure");
    expect(result?.metrics).toBeDefined();
    expect(result?.metrics?.duration).toBeGreaterThanOrEqual(delayMs - 5);
  });
});
