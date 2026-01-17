import { describe, it, expect } from "vitest";
import { TaskRunner } from "../src/TaskRunner";
import { TaskStep } from "../src/TaskStep";

describe("TaskRunner Robustness", () => {
  it("should abort execution when signal is aborted", async () => {
    const steps: TaskStep<unknown>[] = [
      {
        name: "SlowTask",
        run: async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return { status: "success" };
        },
      },
    ];

    const controller = new AbortController();
    const runner = new TaskRunner({});

    // Start execution
    const promise = runner.execute(steps, { signal: controller.signal });

    // Abort immediately
    controller.abort();

    // The task should fail with "Execution aborted"
    const results = await promise;
    expect(results.get("SlowTask")?.status).toBe("failure");
    expect(results.get("SlowTask")?.error).toBe("Execution aborted");
  });

  it("should timeout if task takes too long", async () => {
    const steps: TaskStep<unknown>[] = [
      {
        name: "SlowTask",
        run: async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return { status: "success" };
        },
      },
    ];

    const runner = new TaskRunner({});

    // Timeout set to 10ms, task takes 100ms
    const results = await runner.execute(steps, { timeout: 10 });

    expect(results.get("SlowTask")?.status).toBe("failure");
    expect(results.get("SlowTask")?.error).toMatch(/timed out/);
  });
});
