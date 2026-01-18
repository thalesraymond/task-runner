import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RetryingExecutionStrategy } from "../../src/strategies/RetryingExecutionStrategy.js";
import { StandardExecutionStrategy } from "../../src/strategies/StandardExecutionStrategy.js";
import { TaskStep } from "../../src/TaskStep.js";
import { TaskResult } from "../../src/TaskResult.js";
import { IExecutionStrategy } from "../../src/strategies/IExecutionStrategy.js";

describe("RetryingExecutionStrategy", () => {
  let innerStrategy: IExecutionStrategy<any>;
  let retryingStrategy: RetryingExecutionStrategy<any>;

  beforeEach(() => {
    innerStrategy = new StandardExecutionStrategy();
    retryingStrategy = new RetryingExecutionStrategy(innerStrategy);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("should execute successfully without retry if task succeeds", async () => {
    const task: TaskStep<any> = {
      name: "task1",
      run: vi.fn().mockResolvedValue({ status: "success" }),
    };

    const result = await retryingStrategy.execute(task, {});

    expect(result.status).toBe("success");
    expect(task.run).toHaveBeenCalledTimes(1);
  });

  it("should execute successfully without retry if task has no retry config", async () => {
    const task: TaskStep<any> = {
      name: "task1",
      run: vi.fn().mockResolvedValue({ status: "failure", error: "failed" }),
    };

    const result = await retryingStrategy.execute(task, {});

    expect(result.status).toBe("failure");
    expect(task.run).toHaveBeenCalledTimes(1);
  });

  it("should retry task if it fails and has retry config (fixed backoff)", async () => {
    const runMock = vi.fn()
      .mockResolvedValueOnce({ status: "failure", error: "fail 1" })
      .mockResolvedValueOnce({ status: "success" });

    const task: TaskStep<any> = {
      name: "task1",
      retry: {
        attempts: 2,
        delay: 100,
        backoff: "fixed",
      },
      run: runMock,
    };

    const promise = retryingStrategy.execute(task, {});

    // First attempt fails immediately (or async next tick)
    await vi.advanceTimersByTimeAsync(0);
    expect(runMock).toHaveBeenCalledTimes(1);

    // Should wait 100ms
    await vi.advanceTimersByTimeAsync(100);

    // Should run second time
    expect(runMock).toHaveBeenCalledTimes(2);

    const result = await promise;
    expect(result.status).toBe("success");
  });

  it("should fail after max attempts reached", async () => {
    const runMock = vi.fn().mockResolvedValue({ status: "failure", error: "fail" });

    const task: TaskStep<any> = {
      name: "task1",
      retry: {
        attempts: 2,
        delay: 100,
        backoff: "fixed",
      },
      run: runMock,
    };

    const promise = retryingStrategy.execute(task, {});

    // Initial run
    await vi.advanceTimersByTimeAsync(0);
    expect(runMock).toHaveBeenCalledTimes(1);

    // Wait 100ms
    await vi.advanceTimersByTimeAsync(100);
    expect(runMock).toHaveBeenCalledTimes(2);

    // Wait 100ms
    await vi.advanceTimersByTimeAsync(100);
    expect(runMock).toHaveBeenCalledTimes(3);

    // Should not retry anymore (0 + 2 retries = 3 runs)
    const result = await promise;
    expect(result.status).toBe("failure");
    expect(runMock).toHaveBeenCalledTimes(3);
  });

  it("should use exponential backoff", async () => {
    const runMock = vi.fn().mockResolvedValue({ status: "failure", error: "fail" });

    const task: TaskStep<any> = {
      name: "task1",
      retry: {
        attempts: 3,
        delay: 100,
        backoff: "exponential",
      },
      run: runMock,
    };

    const promise = retryingStrategy.execute(task, {});

    // 1st run
    await vi.advanceTimersByTimeAsync(0);
    expect(runMock).toHaveBeenCalledTimes(1);

    // Retry 1: delay 100 * 2^(1-1) = 100
    await vi.advanceTimersByTimeAsync(100);
    expect(runMock).toHaveBeenCalledTimes(2);

    // Retry 2: delay 100 * 2^(2-1) = 200
    await vi.advanceTimersByTimeAsync(200);
    expect(runMock).toHaveBeenCalledTimes(3);

    // Retry 3: delay 100 * 2^(3-1) = 400
    await vi.advanceTimersByTimeAsync(400);
    expect(runMock).toHaveBeenCalledTimes(4);

    const result = await promise;
    expect(result.status).toBe("failure");
  });

  it("should handle cancellation during delay", async () => {
    const runMock = vi.fn().mockResolvedValue({ status: "failure", error: "fail" });
    const task: TaskStep<any> = {
      name: "task1",
      retry: {
        attempts: 1,
        delay: 1000,
      },
      run: runMock,
    };

    const controller = new AbortController();
    const promise = retryingStrategy.execute(task, {}, controller.signal);

    await vi.advanceTimersByTimeAsync(0);
    expect(runMock).toHaveBeenCalledTimes(1);

    // During delay, abort
    controller.abort();

    // Should resolve immediately with cancelled status
    // We need to advance timers slightly to trigger the promise rejection callback from sleep if it uses setTimeout
    await vi.advanceTimersByTimeAsync(10);

    const result = await promise;
    expect(result.status).toBe("cancelled");
    expect(result.message).toContain("Task cancelled during retry delay");
  });

  it("should handle cancellation before execution", async () => {
     const task: TaskStep<any> = {
      name: "task1",
      retry: { attempts: 1, delay: 100 },
      run: vi.fn(),
    };
    const controller = new AbortController();
    controller.abort();

    const result = await retryingStrategy.execute(task, {}, controller.signal);
    expect(result.status).toBe("cancelled");
    expect(result.message).toBe("Task cancelled before execution");
  });

  it("should propagate error if sleep throws non-abort error", async () => {
     // This test is theoretical as sleep currently only throws AbortError or standard errors if setTimeout fails (unlikely)
     // But we want to ensure try/catch block coverage if we modify sleep
     const mockStrategy = {
         execute: vi.fn().mockResolvedValue({ status: "failure" })
     };
     const strategy = new RetryingExecutionStrategy(mockStrategy as any);

     // Mocking sleep to throw
     const sleepSpy = vi.spyOn(strategy as any, 'sleep').mockRejectedValue(new Error("Random error"));

     const task: TaskStep<any> = {
      name: "task1",
      retry: { attempts: 1, delay: 100 },
      run: vi.fn(),
    };

    await expect(strategy.execute(task, {})).rejects.toThrow("Random error");
  });

  it("should handle cancellation if signal is aborted right before sleep (covering fast-fail in sleep)", async () => {
    const controller = new AbortController();

    // Mock strategy that fails but allows us to abort before it returns
    // In reality, we want to simulate:
    // 1. Task runs.
    // 2. Cancellation happens.
    // 3. Task finishes with 'failure' (ignoring cancellation or racing it).
    // 4. Retry strategy attempts to sleep.
    // 5. Sleep sees cancellation immediately.

    const runMock = vi.fn().mockImplementation(async () => {
        // Abort while task is "running"
        controller.abort();
        return { status: "failure", error: "fail" };
    });

    const task: TaskStep<any> = {
      name: "task1",
      retry: { attempts: 1, delay: 100 },
      run: runMock,
    };

    const result = await retryingStrategy.execute(task, {}, controller.signal);

    expect(result.status).toBe("cancelled");
    expect(result.message).toContain("Task cancelled during retry delay");
    expect(runMock).toHaveBeenCalledTimes(1);
  });
});
