import { describe, it, expect } from "vitest";
import { TaskRunner } from "../../src/TaskRunner.js";
import { TaskStep } from "../../src/TaskStep.js";

describe("Conditional Retries Integration", () => {
  it("should retry on transient errors and fail fast on permanent errors", async () => {
    let taskAAttempts = 0;
    let taskBAttempts = 0;

    const steps: TaskStep<unknown>[] = [
      {
        name: "TaskA", // Transient error, should retry
        run: async () => {
          taskAAttempts++;
          if (taskAAttempts < 3) {
            return { status: "failure", error: "Transient" };
          }
          return { status: "success" };
        },
        retry: {
          attempts: 3,
          delay: 10,
          shouldRetry: (err) => err === "Transient",
        },
      },
      {
        name: "TaskB", // Permanent error, should fail immediately
        run: async () => {
          taskBAttempts++;
          return { status: "failure", error: "Permanent" };
        },
        retry: {
          attempts: 3,
          delay: 10,
          shouldRetry: (err) => err !== "Permanent",
        },
      },
    ];

    const runner = new TaskRunner({});
    const results = await runner.execute(steps);

    // Task A should have succeeded after retries
    expect(results.get("TaskA")?.status).toBe("success");
    expect(taskAAttempts).toBe(3);

    // Task B should have failed immediately
    expect(results.get("TaskB")?.status).toBe("failure");
    expect(taskBAttempts).toBe(1);
  });
});
