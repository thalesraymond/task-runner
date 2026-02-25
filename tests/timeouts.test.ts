import { describe, it, expect } from "vitest";
import { TaskRunner } from "../src/TaskRunner.js";
import { TaskStep } from "../src/TaskStep.js";

describe("TaskRunner Timeouts", () => {
  it("should fail a slow task and skip dependents", async () => {
    const steps: TaskStep<unknown>[] = [
      {
        name: "slow-task",
        timeout: 50,
        run: async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return { status: "success" };
        },
      },
      {
        name: "dependent-task",
        dependencies: ["slow-task"],
        run: async () => {
          return { status: "success" };
        },
      },
      {
        name: "independent-task",
        run: async () => {
          return { status: "success" };
        },
      },
    ];

    const runner = new TaskRunner({});
    const results = await runner.execute(steps);

    expect(results.get("slow-task")?.status).toBe("failure");
    expect(results.get("slow-task")?.error).toContain("Task timed out after 50ms");
    expect(results.get("dependent-task")?.status).toBe("skipped");
    expect(results.get("independent-task")?.status).toBe("success");
  });

  it("should allow tasks to complete if they finish before timeout", async () => {
    const steps: TaskStep<unknown>[] = [
      {
        name: "fast-task",
        timeout: 200,
        run: async () => {
          await new Promise((resolve) => setTimeout(resolve, 50));
          return { status: "success" };
        },
      },
    ];

    const runner = new TaskRunner({});
    const results = await runner.execute(steps);

    expect(results.get("fast-task")?.status).toBe("success");
  });
});
