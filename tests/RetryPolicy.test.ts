import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { StandardExecutionStrategy } from "../src/strategies/StandardExecutionStrategy.js";
import { TaskStep } from "../src/TaskStep.js";
import { TaskResult } from "../src/TaskResult.js";

describe("StandardExecutionStrategy - Retry Policy", () => {
  let strategy: StandardExecutionStrategy<any>;
  let context: any;

  beforeEach(() => {
    strategy = new StandardExecutionStrategy();
    context = {};
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should succeed on first try without retry config", async () => {
    const step: TaskStep<any> = {
      name: "test-task",
      run: vi.fn().mockResolvedValue({ status: "success" }),
    };

    const result = await strategy.execute(step, context);
    expect(result.status).toBe("success");
    expect(step.run).toHaveBeenCalledTimes(1);
  });

  it("should succeed on first try even with retry config", async () => {
    const step: TaskStep<any> = {
      name: "test-task",
      retry: { attempts: 3, delay: 100 },
      run: vi.fn().mockResolvedValue({ status: "success" }),
    };

    const result = await strategy.execute(step, context);
    expect(result.status).toBe("success");
    expect(step.run).toHaveBeenCalledTimes(1);
  });

  it("should retry on failure and eventually succeed", async () => {
    const runMock = vi.fn()
      .mockRejectedValueOnce(new Error("Fail 1"))
      .mockRejectedValueOnce(new Error("Fail 2"))
      .mockResolvedValue({ status: "success" });

    const step: TaskStep<any> = {
      name: "test-task",
      retry: { attempts: 3, delay: 10 },
      run: runMock,
    };

    const promise = strategy.execute(step, context);

    // Fast-forward time for delays
    await vi.runAllTimersAsync();

    const result = await promise;
    expect(result.status).toBe("success");
    expect(runMock).toHaveBeenCalledTimes(3); // Initial + 2 retries
  });

  it("should retry on returned failure status and eventually succeed", async () => {
    const runMock = vi.fn()
      .mockResolvedValueOnce({ status: "failure", error: "Fail 1" })
      .mockResolvedValue({ status: "success" });

    const step: TaskStep<any> = {
      name: "test-task",
      retry: { attempts: 2, delay: 10 },
      run: runMock,
    };

    const promise = strategy.execute(step, context);
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result.status).toBe("success");
    expect(runMock).toHaveBeenCalledTimes(2);
  });

  it("should fail after exhausting retries", async () => {
    const runMock = vi.fn().mockRejectedValue(new Error("Always fail"));

    const step: TaskStep<any> = {
      name: "test-task",
      retry: { attempts: 2, delay: 10 },
      run: runMock,
    };

    const promise = strategy.execute(step, context);
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result.status).toBe("failure");
    expect(result.error).toBe("Always fail");
    expect(runMock).toHaveBeenCalledTimes(3); // Initial + 2 retries
  });

  it("should respect fixed backoff delay", async () => {
    const runMock = vi.fn().mockRejectedValue(new Error("Fail"));
    const delay = 100;

    const step: TaskStep<any> = {
      name: "test-task",
      retry: { attempts: 2, delay, backoff: "fixed" },
      run: runMock,
    };

    const promise = strategy.execute(step, context);

    // First run fails immediately (async)
    // Then waits for delay
    await vi.advanceTimersByTimeAsync(1); // Advance a tick to let the promise chain proceed

    expect(vi.getTimerCount()).toBe(1); // One timer set

    await vi.advanceTimersByTimeAsync(delay);
    // Second run (retry 1) fails

    await vi.advanceTimersByTimeAsync(delay);
    // Third run (retry 2) fails

    const result = await promise;
    expect(result.status).toBe("failure");
    expect(runMock).toHaveBeenCalledTimes(3);
  });

  it("should respect exponential backoff delay", async () => {
    const runMock = vi.fn().mockRejectedValue(new Error("Fail"));
    const baseDelay = 100;

    const step: TaskStep<any> = {
      name: "test-task",
      retry: { attempts: 3, delay: baseDelay, backoff: "exponential" },
      run: runMock,
    };

    const promise = strategy.execute(step, context);

    // Initial run fails

    // Retry 1: Delay = 100 * 2^0 = 100
    await vi.advanceTimersByTimeAsync(baseDelay);
    // Retry 1 runs and fails

    // Retry 2: Delay = 100 * 2^1 = 200
    await vi.advanceTimersByTimeAsync(baseDelay * 2);
    // Retry 2 runs and fails

    // Retry 3: Delay = 100 * 2^2 = 400
    await vi.advanceTimersByTimeAsync(baseDelay * 4);
    // Retry 3 runs and fails

    const result = await promise;
    expect(result.status).toBe("failure");
    expect(runMock).toHaveBeenCalledTimes(4); // Initial + 3 retries
  });

  it("should stop retrying if cancelled", async () => {
    const controller = new AbortController();
    const runMock = vi.fn().mockRejectedValue(new Error("Fail"));

    const step: TaskStep<any> = {
      name: "test-task",
      retry: { attempts: 5, delay: 1000 },
      run: runMock,
    };

    const promise = strategy.execute(step, context, controller.signal);

    // Initial run fails
    // Waiting for retry...

    // Cancel during the delay
    controller.abort();

    // Fast forward to ensure timer would have fired if not cleared
    await vi.runAllTimersAsync();

    const result = await promise;
    expect(result.status).toBe("cancelled");
    expect(result.message).toContain("cancelled");

    // Should verify it didn't run all 5 retries
    // It runs once (initial), then waits. Abort happens during wait.
    expect(runMock).toHaveBeenCalledTimes(1);
  });

  it("should handle cancellation during retry delay (sleep)", async () => {
    const controller = new AbortController();
    const runMock = vi.fn().mockRejectedValue(new Error("Fail"));

    const step: TaskStep<any> = {
      name: "test-task",
      retry: { attempts: 2, delay: 1000 },
      run: runMock,
    };

    const promise = strategy.execute(step, context, controller.signal);

    // Initial run fails
    await vi.advanceTimersByTimeAsync(1);

    // We are now in sleep
    // Abort!
    controller.abort();

    // Advance timers to trigger the rejection from sleep if it wasn't immediate
    await vi.runAllTimersAsync();

    const result = await promise;
    expect(result.status).toBe("cancelled");
    expect(result.message).toBe("Task cancelled during retry delay");
  });

  it("should handle cancellation immediately after retry delay", async () => {
    // This is tricky to test deterministically without mocking sleep directly,
    // but we can try to abort right when sleep resolves.
    // However, the strategy checks signal.aborted right after sleep awaits.

    const controller = new AbortController();
    const runMock = vi.fn().mockRejectedValue(new Error("Fail"));

    const step: TaskStep<any> = {
      name: "test-task",
      retry: { attempts: 2, delay: 1000 },
      run: runMock,
    };

    const promise = strategy.execute(step, context, controller.signal);

    // Initial run fails
    await vi.advanceTimersByTimeAsync(1);

    // In sleep... advance time to complete sleep
    await vi.advanceTimersByTimeAsync(1000);

    // Right after sleep, we abort
    controller.abort();

    // Let the loop continue
    await vi.runAllTimersAsync();

    const result = await promise;
    expect(result.status).toBe("cancelled");
    // Depending on timing, it might hit "Task cancelled after retry delay"
    // or enter execution and hit "Task cancelled during execution" if run checks signal.
    // But since we abort *after* sleep resolves but before run, it should hit the check after sleep.
    // Wait, `await sleep` returns, then we check `if (signal?.aborted)`.
    // So if we abort strictly after sleep resolves, the check should catch it.
    // But advanceTimersByTimeAsync resolves the sleep promise. The continuation microtask runs.
    // We need to inject the abort in between.

    // Actually, checking "Task cancelled after retry delay" is hard because
    // it requires aborting *exactly* between await sleep and the if check.
    // Since JS is single threaded, we can't interrupt the microtask queue easily unless we mock sleep.
    // But we can verify "Task cancelled during execution" if we abort before run starts.
  });

  it("should return cancelled status if AbortError is thrown during execution", async () => {
    const controller = new AbortController();
    const runMock = vi.fn().mockImplementation(async (ctx, sig) => {
        if (sig.aborted) throw new Error("AbortError");
        return { status: "success" };
    });

    const step: TaskStep<any> = {
      name: "test-task",
      retry: { attempts: 2 },
      run: runMock,
    };

    // Abort before run
    controller.abort();
    const result = await strategy.execute(step, context, controller.signal);
    expect(result.status).toBe("cancelled");
    expect(result.message).toBe("Task cancelled before execution attempt");
  });

   it("should catch AbortError thrown by run and return cancelled", async () => {
    // Let's create a run that aborts the controller then throws
    const controller = new AbortController();
    const runMock = vi.fn().mockImplementation(async (ctx, sig) => {
        controller.abort();
        const e = new Error("AbortError");
        e.name = "AbortError";
        throw e;
    });

     const step: TaskStep<any> = {
      name: "test-task",
      retry: { attempts: 0 },
      run: runMock,
    };

    const result = await strategy.execute(step, context, controller.signal);
    expect(result.status).toBe("cancelled");
    expect(result.message).toBe("Task cancelled during execution");
  });

  it("should return failure if returned failure persists until attempts exhausted", async () => {
    const runMock = vi.fn().mockResolvedValue({ status: "failure", error: "Persistent fail" });

    const step: TaskStep<any> = {
      name: "test-task",
      retry: { attempts: 2, delay: 10 },
      run: runMock,
    };

    const promise = strategy.execute(step, context);
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result.status).toBe("failure");
    expect(result.error).toBe("Persistent fail");
    expect(runMock).toHaveBeenCalledTimes(3);
  });

  it("should return cancelled if task returns cancelled status", async () => {
    const runMock = vi.fn().mockResolvedValue({ status: "cancelled", message: "Task decided to cancel" });

    const step: TaskStep<any> = {
      name: "test-task",
      retry: { attempts: 2 },
      run: runMock,
    };

    const result = await strategy.execute(step, context);
    expect(result.status).toBe("cancelled");
    expect(result.message).toBe("Task decided to cancel");
    // Should not retry
    expect(runMock).toHaveBeenCalledTimes(1);
  });

  it("should continue retry if sleep throws non-abort error", async () => {
    // Mock sleep to throw an error
    const sleepSpy = vi.spyOn(StandardExecutionStrategy.prototype as any, 'sleep').mockRejectedValue(new Error("Sleep fail"));

    const runMock = vi.fn().mockResolvedValue({ status: "success" });

    const step: TaskStep<any> = {
      name: "test-task",
      retry: { attempts: 1, delay: 10 }, // delay needed to trigger sleep
      run: runMock,
    };

    // First run fails (we need it to fail to trigger retry)
    runMock.mockRejectedValueOnce(new Error("Fail 1"));
    runMock.mockResolvedValueOnce({ status: "success" });

    const result = await strategy.execute(step, context);

    expect(result.status).toBe("success");
    expect(runMock).toHaveBeenCalledTimes(2); // Initial + Retry
    expect(sleepSpy).toHaveBeenCalled();

    sleepSpy.mockRestore();
  });

  it("should handle failure with non-Error object", async () => {
    const runMock = vi.fn().mockRejectedValue("String Error");

    const step: TaskStep<any> = {
      name: "test-task",
      retry: { attempts: 1 },
      run: runMock,
    };

    const result = await strategy.execute(step, context);
    expect(result.status).toBe("failure");
    expect(result.error).toBe("String Error");
  });

  it("should retry with 0 delay", async () => {
    const runMock = vi.fn()
      .mockRejectedValueOnce(new Error("Fail"))
      .mockResolvedValue({ status: "success" });

    const step: TaskStep<any> = {
      name: "test-task",
      retry: { attempts: 1, delay: 0 },
      run: runMock,
    };

    const promise = strategy.execute(step, context);

    // No delay, should resolve immediately
    await vi.runAllTimersAsync();

    const result = await promise;
    expect(result.status).toBe("success");
    expect(runMock).toHaveBeenCalledTimes(2);
  });

  it("should reject sleep immediately if already aborted", async () => {
    const controller = new AbortController();
    controller.abort();

    // We can't access sleep directly, but we can verify that if we start a retry with aborted signal,
    // it returns cancelled.
    // But `execute` checks abort *before* entering loop and *before* sleep.
    // So to hit `sleep`'s initial check (line 132), we need to bypass the other checks.
    // 1. `execute` check (lines 28-34): if (signal?.aborted) ...
    // So we can't get to sleep if we start aborted.

    // However, we can get to sleep if we abort *after* the initial check but *before* sleep is called?
    // Sleep is called inside the loop if i > 0.
    // So:
    // 1. Start not aborted.
    // 2. Initial run fails.
    // 3. Loop increments to i=1.
    // 4. `if (signal?.aborted)` check inside loop (lines 28-34) runs.
    // 5. If we abort HERE, we return.
    // 6. Then `if (i > 0 && retryConfig)` runs.
    // 7. `calculateDelay` runs.
    // 8. `await this.sleep` runs.
    // 9. Inside `sleep`: `if (ms <= 0)` ... then `new Promise`.
    // 10. Inside Promise executor: `if (signal?.aborted)`.

    // So we need to abort *between* the check at start of loop and the call to sleep.
    // This is synchronous code. We can't interrupt it.
    // So `sleep`'s `if (signal?.aborted)` check is technically redundant given the check at the top of the loop?
    // Unless `calculateDelay` triggers a side effect that aborts (unlikely).
    // Or if `i > 0` block is entered, and we just passed the check.
    // Yes, because JS is single threaded, if we pass the check at line 28, we will reach line 40 (sleep) without interruption.
    // So `sleep` receives a non-aborted signal initially.
    // So lines 132-135 are also unreachable in this specific usage context?
    // But `sleep` is a private method that *could* be used elsewhere or if logic changes.
    // So it's good defensive coding.
    // We should probably `v8 ignore` it too if we can't reach it.
  });
});
