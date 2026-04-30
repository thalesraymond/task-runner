import { describe, it, expect } from "vitest";
import { TaskRunner } from "../src/TaskRunner.js";
import { TaskStep } from "../src/TaskStep.js";
import { TaskResult } from "../src/TaskResult.js";

interface TestContext {
  [key: string]: unknown;
}

import { sleep } from "../src/utils/sleep.js";

const cancellableRun =
  (ms: number) => async (_ctx: TestContext, signal?: AbortSignal) => {
    return new Promise<TaskResult>((resolve, reject) => {
      if (signal?.aborted) {
        const err = new Error("Aborted");
        err.name = "AbortError";
        reject(err);
        return;
      }

      const timeout = setTimeout(() => {
        resolve({ status: "success" });
      }, ms);

      signal?.addEventListener("abort", () => {
        clearTimeout(timeout);
        const err = new Error("Aborted");
        err.name = "AbortError";
        reject(err);
      });
    });
  };

describe("TaskRunner Cancellation", () => {
  it("should execute tasks normally without cancellation", async () => {
    const task: TaskStep<TestContext> = {
      name: "task1",
      run: async () => ({ status: "success" }),
    };

    const runner = new TaskRunner<TestContext>({});
    const results = await runner.execute([task]);

    expect(results.get("task1")?.status).toBe("success");
  });

  it("should cancel workflow via AbortSignal", async () => {
    const controller = new AbortController();
    const task1: TaskStep<TestContext> = {
      name: "task1",
      run: cancellableRun(50),
    };
    const task2: TaskStep<TestContext> = {
      name: "task2",
      dependencies: ["task1"],
      run: async () => ({ status: "success" }),
    };

    const runner = new TaskRunner<TestContext>({});
    const executePromise = runner.execute([task1, task2], {
      signal: controller.signal,
    });

    // Cancel immediately (wait a tiny bit to ensure task started)
    await sleep(10);
    controller.abort();

    const results = await executePromise;
    expect(results.get("task1")?.status).toBe("cancelled");
    expect(results.get("task2")?.status).toBe("cancelled"); // Task 2 never ran
  });

  it("should cancel workflow via global timeout", async () => {
    const task1: TaskStep<TestContext> = {
      name: "task1",
      run: cancellableRun(100),
    };

    const runner = new TaskRunner<TestContext>({});
    // Timeout 50ms, task takes 100ms
    const results = await runner.execute([task1], { timeout: 50 });

    expect(results.get("task1")?.status).toBe("cancelled");
    expect(results.get("task1")?.message).toBe(
      "Task cancelled during execution"
    );
    // Note: The message comes from runStep catch block because task throws AbortError
  });

  it("should handle pre-aborted signal", async () => {
    const controller = new AbortController();
    controller.abort();

    const task1: TaskStep<TestContext> = {
      name: "task1",
      run: async () => ({ status: "success" }),
    };

    const runner = new TaskRunner<TestContext>({});
    const results = await runner.execute([task1], {
      signal: controller.signal,
    });

    expect(results.get("task1")?.status).toBe("cancelled");
    expect(results.get("task1")?.message).toBe(
      "Workflow cancelled before execution started."
    );
  });

  it("should propagate cancellation to running task", async () => {
    const controller = new AbortController();

    const task1: TaskStep<TestContext> = {
      name: "task1",
      run: cancellableRun(100),
    };

    const runner = new TaskRunner<TestContext>({});
    const executePromise = runner.execute([task1], {
      signal: controller.signal,
    });

    // Allow task to start
    await sleep(10);
    controller.abort(new Error("External abort"));

    const results = await executePromise;
    expect(results.get("task1")?.status).toBe("cancelled");
    expect(results.get("task1")?.message).toBe(
      "Task cancelled during execution"
    );
  });

  it("should respect timeout over signal if timeout happens first", async () => {
    const controller = new AbortController();
    const task1: TaskStep<TestContext> = {
      name: "task1",
      run: cancellableRun(100),
    };

    const runner = new TaskRunner<TestContext>({});
    // Timeout 50ms, task 100ms. Signal exists but doesn't fire.
    const results = await runner.execute([task1], {
      signal: controller.signal,
      timeout: 50,
    });

    expect(results.get("task1")?.status).toBe("cancelled");
  });

  it("should handle case where timeout is set AND signal is already aborted", async () => {
    const controller = new AbortController();
    controller.abort();

    const task1: TaskStep<TestContext> = {
      name: "task1",
      run: async () => ({ status: "success" }),
    };

    const runner = new TaskRunner<TestContext>({});
    const results = await runner.execute([task1], {
      signal: controller.signal,
      timeout: 50,
    });

    expect(results.get("task1")?.status).toBe("cancelled");
    expect(results.get("task1")?.message).toBe(
      "Workflow cancelled before execution started."
    );
  });

  it("should cancel workflow via AbortSignal when timeout is also set", async () => {
    const controller = new AbortController();
    const task1: TaskStep<TestContext> = {
      name: "task1",
      run: cancellableRun(100),
    };

    const runner = new TaskRunner<TestContext>({});
    // Timeout 200ms (won't happen), task 100ms. Abort at 10ms.
    const executePromise = runner.execute([task1], {
      signal: controller.signal,
      timeout: 200,
    });

    await sleep(10);
    controller.abort();

    const results = await executePromise;
    expect(results.get("task1")?.status).toBe("cancelled");
    expect(results.get("task1")?.message).toBe(
      "Task cancelled during execution"
    );
  });

  it("should fail task if it throws non-abort error during cancellation", async () => {
    const controller = new AbortController();

    const task1: TaskStep<TestContext> = {
      name: "task1",
      run: async (_ctx, signal) => {
        return new Promise((_, reject) => {
          signal?.addEventListener("abort", () => {
            reject(new Error("Random failure"));
          });
        });
      },
    };

    const runner = new TaskRunner<TestContext>({});
    const executePromise = runner.execute([task1], {
      signal: controller.signal,
    });

    await sleep(10);
    controller.abort();

    const results = await executePromise;
    // Should be "failure" because it threw a generic Error, not AbortError
    expect(results.get("task1")?.status).toBe("failure");
    expect(results.get("task1")?.error).toBe("Random failure");
  });

  it("should cancel task if it rejects with signal.reason", async () => {
    const controller = new AbortController();

    const task1: TaskStep<TestContext> = {
      name: "task1",
      run: async (_ctx, signal) => {
        return new Promise((_, reject) => {
          signal?.addEventListener("abort", () => {
            reject(signal.reason);
          });
        });
      },
    };

    const runner = new TaskRunner<TestContext>({});
    const executePromise = runner.execute([task1], {
      signal: controller.signal,
    });

    await sleep(10);
    const reason = new Error("Explicit abort reason");
    controller.abort(reason);

    const results = await executePromise;
    expect(results.get("task1")?.status).toBe("cancelled");
    expect(results.get("task1")?.message).toBe(
      "Task cancelled during execution"
    );
  });

  it("should handle timeout correctly if ms is negative or zero", async () => {
    let resolved = false;
    await sleep(0).then(() => { resolved = true; });
    expect(resolved).toBe(true);

    resolved = false;
    await sleep(-10).then(() => { resolved = true; });
    expect(resolved).toBe(true);

    const controller = new AbortController();
    controller.abort();
    let rejected = false;
    await sleep(0, controller.signal).catch(() => { rejected = true; });
    expect(rejected).toBe(false);

    let rejected2 = false;
    await sleep(-5, controller.signal).catch(() => { rejected2 = true; });
    expect(rejected2).toBe(false);
  });

  it("should cleanup correctly when sleep aborts or resolves", async () => {
    const ac = new AbortController();
    const p = sleep(10, ac.signal);
    ac.abort();
    await expect(p).rejects.toThrow("AbortError");

    const ac2 = new AbortController();
    await expect(sleep(5, ac2.signal)).resolves.toBeUndefined();
  });

  it("should trigger immediate abort in sleep if already aborted", async () => {
    const ac = new AbortController();
    ac.abort(new Error("already aborted"));
    await expect(sleep(10, ac.signal)).rejects.toThrow("AbortError");
  });

  it("should trigger early return on aborted signal during positive ms", async () => {
    const controller = new AbortController();
    const p = sleep(10, controller.signal);
    controller.abort();
    await expect(p).rejects.toThrow();

    const controller2 = new AbortController();
    await sleep(1, controller2.signal);
  });

  it("should trigger cleanup empty block mutant", async () => {
    const controller = new AbortController();
    const originalRemove = controller.signal.removeEventListener;
    let removedEvent: unknown = "";
    controller.signal.removeEventListener = (event: unknown, handler: unknown) => {
      removedEvent = event;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      originalRemove.call(controller.signal, event as any, handler as any);
    };

    await sleep(1, controller.signal);
    expect(removedEvent).toBe("abort");
  });

  it("should trigger early resolve empty block mutant", async () => {
    const start = Date.now();
    await sleep(-10);
    const end = Date.now();
    expect(end - start).toBeLessThan(10);
  });

  it("should handle empty block mutant in sleep promise", async () => {
    let resolved = false;
    await sleep(-10).then(() => { resolved = true; });
    expect(resolved).toBe(true);

    const controller = new AbortController();
    await sleep(10, controller.signal).catch(() => {});
  });

  it("should handle timeout correctly if ms is negative or zero", async () => {
    let resolved = false;
    await sleep(0).then(() => { resolved = true; });
    expect(resolved).toBe(true);

    resolved = false;
    await sleep(-10).then(() => { resolved = true; });
    expect(resolved).toBe(true);

    const controller = new AbortController();
    controller.abort();
    let rejected = false;
    await sleep(0, controller.signal).catch(() => { rejected = true; });
    expect(rejected).toBe(false);

    let rejected2 = false;
    await sleep(-5, controller.signal).catch(() => { rejected2 = true; });
    expect(rejected2).toBe(false);
  });

  it("should cleanup correctly when sleep aborts or resolves", async () => {
    const ac = new AbortController();
    const p = sleep(10, ac.signal);
    ac.abort();
    await expect(p).rejects.toThrow("AbortError");

    const ac2 = new AbortController();
    await expect(sleep(5, ac2.signal)).resolves.toBeUndefined();
  });

  it("should trigger immediate abort in sleep if already aborted", async () => {
    const ac = new AbortController();
    ac.abort(new Error("already aborted"));
    await expect(sleep(10, ac.signal)).rejects.toThrow("AbortError");
  });

  it("should trigger early return on aborted signal during positive ms", async () => {
    const controller = new AbortController();
    const p = sleep(10, controller.signal);
    controller.abort();
    await expect(p).rejects.toThrow();

    const controller2 = new AbortController();
    await sleep(1, controller2.signal);
  });

  it("should trigger cleanup empty block mutant", async () => {
    const controller = new AbortController();
    const originalRemove = controller.signal.removeEventListener;
    let removedEvent: unknown = "";
    controller.signal.removeEventListener = (event: unknown, handler: unknown) => {
      removedEvent = event;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      originalRemove.call(controller.signal, event as any, handler as any);
    };

    await sleep(1, controller.signal);
    expect(removedEvent).toBe("abort");
  });

  it("should trigger early resolve empty block mutant", async () => {
    const start = Date.now();
    await sleep(-10);
    const end = Date.now();
    expect(end - start).toBeLessThan(10);
  });

  it("should handle empty block mutant in sleep promise", async () => {
    let resolved = false;
    await sleep(-10).then(() => { resolved = true; });
    expect(resolved).toBe(true);

    const controller = new AbortController();
    await sleep(10, controller.signal).catch(() => {});
  });
});
