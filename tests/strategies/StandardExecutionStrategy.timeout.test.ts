import { describe, it, expect, vi } from "vitest";
import { StandardExecutionStrategy } from "../../src/strategies/StandardExecutionStrategy.js";
import { TaskStep } from "../../src/TaskStep.js";

describe("StandardExecutionStrategy Timeout", () => {
  const strategy = new StandardExecutionStrategy<unknown>();

  it("should fail task if it exceeds timeout", async () => {
    const step: TaskStep<unknown> = {
      name: "slow-task",
      timeout: 100,
      run: async () => {
        // Wait longer than timeout
        await new Promise((resolve) => setTimeout(resolve, 200));
        return { status: "success" };
      },
    };

    const result = await strategy.execute(step, {});
    expect(result.status).toBe("failure");
    expect(result.error).toContain("Task timed out after 100ms");
  });

  it("should succeed if task finishes before timeout", async () => {
    const step: TaskStep<unknown> = {
      name: "fast-task",
      timeout: 200,
      run: async () => {
        // Wait less than timeout
        await new Promise((resolve) => setTimeout(resolve, 50));
        return { status: "success" };
      },
    };

    const result = await strategy.execute(step, {});
    expect(result.status).toBe("success");
  });

  it("should signal abort to the task on timeout", async () => {
    const abortSpy = vi.fn();
    const step: TaskStep<unknown> = {
      name: "abort-check",
      timeout: 50,
      run: async (context, signal) => {
        if (signal) {
          signal.addEventListener("abort", abortSpy);
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
        return { status: "success" };
      },
    };

    await strategy.execute(step, {});
    expect(abortSpy).toHaveBeenCalled();
  });

  it("should handle global cancellation correctly even with timeout set", async () => {
    const controller = new AbortController();
    const step: TaskStep<unknown> = {
      name: "cancelled-task",
      timeout: 500, // Long timeout
      run: async (context, signal) => {
        // Wait for abort
        await new Promise<void>((resolve, reject) => {
          if (signal?.aborted) return reject(signal.reason);
          signal?.addEventListener("abort", () => reject(signal.reason));
          setTimeout(resolve, 1000);
        });
        return { status: "success" };
      },
    };

    const executePromise = strategy.execute(step, {}, controller.signal);

    // Cancel immediately
    controller.abort();

    const result = await executePromise;
    expect(result.status).toBe("cancelled");
    expect(result.message).toBe("Task cancelled during execution");
  });

  it("should allow task to catch abort error and rethrow", async () => {
    const step: TaskStep<unknown> = {
      name: "catch-rethrow",
      timeout: 50,
      run: async (context, signal) => {
        await new Promise((resolve, reject) => {
          const timer = setTimeout(resolve, 100);
          signal?.addEventListener("abort", () => {
            clearTimeout(timer);
            reject(signal.reason);
          });
        });
        return { status: "success" };
      },
    };

    const result = await strategy.execute(step, {});
    expect(result.status).toBe("failure");
    expect(result.error).toContain("Task timed out after 50ms");
  });

  it("should handle execution with already aborted signal", async () => {
    const controller = new AbortController();
    controller.abort(new Error("Pre-aborted"));
    const step: TaskStep<unknown> = {
      name: "pre-aborted",
      timeout: 100,
      run: async (context, signal) => {
        if (signal?.aborted) throw signal.reason;
        return { status: "success" };
      },
    };

    const result = await strategy.execute(step, {}, controller.signal);
    expect(result.status).toBe("cancelled");
  });

  it("should handle task failure with timeout set", async () => {
    const step: TaskStep<unknown> = {
      name: "failing-task",
      timeout: 100,
      run: async () => {
        throw new Error("Generic failure");
      },
    };

    const result = await strategy.execute(step, {});
    expect(result.status).toBe("failure");
    expect(result.error).toBe("Generic failure");
  });

  it("should handle non-Error failures with timeout set", async () => {
    const step: TaskStep<unknown> = {
      name: "string-failure",
      timeout: 100,
      run: async () => {
        throw "String error";
      },
    };

    const result = await strategy.execute(step, {});
    expect(result.status).toBe("failure");
    expect(result.error).toBe("String error");
  });
});
