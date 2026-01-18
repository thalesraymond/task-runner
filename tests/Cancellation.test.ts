import { describe, it, expect } from "vitest";
import { TaskRunner } from "../src/TaskRunner.js";
import { TaskStep } from "../src/TaskStep.js";

describe("TaskRunner Cancellation", () => {
  it("should stop execution when aborted", async () => {
    const controller = new AbortController();
    const steps: TaskStep<unknown>[] = [
      {
        name: "A",
        run: async () => {
            // Cancel immediately after A starts
            controller.abort();
            return { status: "success" };
        },
      },
      {
        name: "B",
        dependencies: ["A"],
        run: async () => {
          return { status: "success" };
        },
      },
    ];

    const runner = new TaskRunner({});
    const results = await runner.execute(steps, { signal: controller.signal });

    expect(results.get("A")?.status).toBe("success");
    // B should be cancelled
    expect(results.get("B")?.status).toBe("cancelled");
  });

  it("should pass abort signal to tasks", async () => {
    const controller = new AbortController();
    const steps: TaskStep<unknown>[] = [
      {
        name: "LongRunning",
        run: (_ctx, signal) => {
          return new Promise((resolve) => {
            const abortHandler = () => {
              clearTimeout(timeout);
              resolve({ status: "cancelled" });
            };

            signal?.addEventListener("abort", abortHandler);

            if (signal?.aborted) {
              signal?.removeEventListener("abort", abortHandler);
              return resolve({ status: "cancelled" });
            }

            const timeout = setTimeout(() => {
              signal?.removeEventListener("abort", abortHandler);
              resolve({ status: "success" });
            }, 100);
          });
        },
      },
    ];

    const runner = new TaskRunner({});
    const executionPromise = runner.execute(steps, { signal: controller.signal });

    // Abort shortly after starting
    setTimeout(() => controller.abort(), 10);

    const results = await executionPromise;
    expect(results.get("LongRunning")?.status).toBe("cancelled");
  });

  it("should stop processing queue if already aborted", async () => {
    const controller = new AbortController();
    controller.abort();

    const steps: TaskStep<unknown>[] = [
      {
        name: "A",
        run: async () => ({ status: "success" }),
      },
    ];

    const runner = new TaskRunner({});
    const results = await runner.execute(steps, { signal: controller.signal });

    expect(results.get("A")?.status).toBe("cancelled");
  });
});
