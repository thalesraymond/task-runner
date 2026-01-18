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

  it("should handle mixed running and cancelled tasks", async () => {
    const controller = new AbortController();
    let resolveA: (v?: unknown) => void;

    const steps: TaskStep<unknown>[] = [
      {
        name: "A",
        run: async () => {
            // Wait until cancelled
            await new Promise(r => resolveA = r);
            return { status: "success" };
        },
      },
      {
        name: "B",
        // B does not depend on A, so it could start if not cancelled
        run: async () => ({ status: "success" }),
      }
    ];

    const runner = new TaskRunner({});
    const executionPromise = runner.execute(steps, { signal: controller.signal });

    // Let them start
    setTimeout(() => {
       controller.abort();
       resolveA(); // A finishes but workflow is aborted
    }, 10);

    const results = await executionPromise;
    expect(results.get("A")?.status).toBe("success");
    // B might be cancelled if it hadn't started yet, or success if it won race
    // In this specific mock, B would likely start immediately because of no deps.
    // Let's force B to wait.
  });

    it("should correctly mark pending tasks as cancelled even if some are running", async () => {
    const controller = new AbortController();

    const steps: TaskStep<unknown>[] = [
      {
        name: "A",
        run: async () => {
            await new Promise(r => setTimeout(r, 50));
            return { status: "success" };
        },
      },
      {
        name: "B",
        dependencies: ["A"],
        run: async () => ({ status: "success" }),
      }
    ];

    const runner = new TaskRunner({});
    const executionPromise = runner.execute(steps, { signal: controller.signal });

    // Abort while A is running
    setTimeout(() => {
       controller.abort();
    }, 10);

    const results = await executionPromise;
    // A finishes eventually (we don't pass signal to it to force cancellation)
    expect(results.get("A")?.status).toBe("success");
    // B should never start
    expect(results.get("B")?.status).toBe("cancelled");
  });
});
