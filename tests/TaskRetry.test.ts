import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { StandardExecutionStrategy } from "../src/strategies/StandardExecutionStrategy.js";
import { TaskStep } from "../src/TaskStep.js";

interface TestContext {
  [key: string]: unknown;
}

describe("StandardExecutionStrategy Retries", () => {
  let strategy: StandardExecutionStrategy<TestContext>;
  let context: TestContext;

  beforeEach(() => {
    strategy = new StandardExecutionStrategy();
    context = {};
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should execute task once if no retry config and task succeeds", async () => {
    const runMock = vi.fn().mockResolvedValue({ status: "success" });
    const step: TaskStep<TestContext> = { name: "test", run: runMock };

    const result = await strategy.execute(step, context);

    expect(result.status).toBe("success");
    expect(runMock).toHaveBeenCalledTimes(1);
  });

  it("should retry task if it returns failure and has retry attempts", async () => {
    // Fail once, then succeed
    const runMock = vi.fn()
      .mockResolvedValueOnce({ status: "failure" })
      .mockResolvedValueOnce({ status: "success" });

    const step: TaskStep<TestContext> = {
      name: "test",
      run: runMock,
      retry: { attempts: 1 },
    };

    const result = await strategy.execute(step, context);

    expect(result.status).toBe("success");
    expect(runMock).toHaveBeenCalledTimes(2);
  });

  it("should retry task if it throws error and has retry attempts", async () => {
    const runMock = vi.fn()
      .mockRejectedValueOnce(new Error("oops"))
      .mockResolvedValueOnce({ status: "success" });

    const step: TaskStep<TestContext> = {
      name: "test",
      run: runMock,
      retry: { attempts: 1 },
    };

    const result = await strategy.execute(step, context);

    expect(result.status).toBe("success");
    expect(runMock).toHaveBeenCalledTimes(2);
  });

  it("should fail after exhausting retries (failure return)", async () => {
    const runMock = vi.fn().mockResolvedValue({ status: "failure" });

    const step: TaskStep<TestContext> = {
      name: "test",
      run: runMock,
      retry: { attempts: 2 },
    };

    const result = await strategy.execute(step, context);

    expect(result.status).toBe("failure");
    // Initial run + 2 retries = 3 total
    expect(runMock).toHaveBeenCalledTimes(3);
  });

  it("should fail after exhausting retries (exception thrown)", async () => {
    const runMock = vi.fn().mockRejectedValue(new Error("oops"));

    const step: TaskStep<TestContext> = {
      name: "test",
      run: runMock,
      retry: { attempts: 2 },
    };

    const result = await strategy.execute(step, context);

    expect(result.status).toBe("failure");
    expect(result.error).toBe("oops");
    expect(runMock).toHaveBeenCalledTimes(3);
  });

  it("should delay between retries (fixed)", async () => {
    const runMock = vi.fn()
      .mockResolvedValueOnce({ status: "failure" })
      .mockResolvedValueOnce({ status: "success" });

    const step: TaskStep<TestContext> = {
      name: "test",
      run: runMock,
      retry: { attempts: 1, delay: 1000, backoff: "fixed" },
    };

    const executePromise = strategy.execute(step, context);

    // Initial run happens immediately (async)
    await Promise.resolve();
    expect(runMock).toHaveBeenCalledTimes(1);

    // Should be waiting now. Advance time less than delay
    await vi.advanceTimersByTimeAsync(500);
    expect(runMock).toHaveBeenCalledTimes(1);

    // Advance rest
    await vi.advanceTimersByTimeAsync(501);
    expect(runMock).toHaveBeenCalledTimes(2);

    const result = await executePromise;
    expect(result.status).toBe("success");
  });

  it("should delay between retries (exponential)", async () => {
    // Fail 2 times, succeed on 3rd attempt (2nd retry)
    const runMock = vi.fn()
      .mockResolvedValueOnce({ status: "failure" })
      .mockResolvedValueOnce({ status: "failure" })
      .mockResolvedValueOnce({ status: "success" });

    const step: TaskStep<TestContext> = {
      name: "test",
      run: runMock,
      retry: { attempts: 2, delay: 100, backoff: "exponential" },
    };

    const executePromise = strategy.execute(step, context);

    // Run 1
    await Promise.resolve();
    expect(runMock).toHaveBeenCalledTimes(1);

    // Wait for first retry (delay * 2^0 = 100ms)
    await vi.advanceTimersByTimeAsync(100);
    expect(runMock).toHaveBeenCalledTimes(2);

    // Wait for second retry (delay * 2^1 = 200ms)
    await vi.advanceTimersByTimeAsync(100);
    expect(runMock).toHaveBeenCalledTimes(2); // Still waiting (need 200ms total)
    await vi.advanceTimersByTimeAsync(100);
    expect(runMock).toHaveBeenCalledTimes(3);

    const result = await executePromise;
    expect(result.status).toBe("success");
  });

  it("should cancel during retry delay", async () => {
    const runMock = vi.fn().mockResolvedValue({ status: "failure" });
    const controller = new AbortController();

    const step: TaskStep<TestContext> = {
      name: "test",
      run: runMock,
      retry: { attempts: 1, delay: 1000 },
    };

    const executePromise = strategy.execute(step, context, controller.signal);

    await Promise.resolve();
    expect(runMock).toHaveBeenCalledTimes(1);

    // During delay, abort
    controller.abort();

    // Fast forward to ensure timer would have fired if not aborted (optional, but good for sanity)
    await vi.advanceTimersByTimeAsync(1000);

    const result = await executePromise;
    expect(result.status).toBe("cancelled");
    expect(result.message).toContain("Task cancelled during retry delay");
    expect(runMock).toHaveBeenCalledTimes(1); // Should not retry
  });

  it("should handle already aborted signal", async () => {
    const runMock = vi.fn();
    const controller = new AbortController();
    controller.abort();

    const step: TaskStep<TestContext> = {
      name: "test",
      run: runMock,
    };

    const result = await strategy.execute(step, context, controller.signal);

    expect(result.status).toBe("cancelled");
    expect(result.message).toContain("Task cancelled before execution attempt");
    expect(runMock).not.toHaveBeenCalled();
  });

  it("should handle cancellation during execution (AbortError)", async () => {
    const controller = new AbortController();

    // Step that simulates listening to abort signal
    const step: TaskStep<TestContext> = {
        name: "test",
        run: async (_ctx, signal) => {
            return new Promise((_, reject) => {
               const onAbort = () => {
                   const err = new Error("The operation was aborted");
                   err.name = "AbortError";
                   reject(err);
               };
               if (signal?.aborted) {
                   onAbort();
               } else {
                   signal?.addEventListener("abort", onAbort);
               }
            });
        }
    };

    const executePromise = strategy.execute(step, context, controller.signal);

    // Trigger abort
    controller.abort();

    const result = await executePromise;
    expect(result.status).toBe("cancelled");
    expect(result.message).toContain("Task cancelled during execution");
  });
});
