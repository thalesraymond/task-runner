import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RetryingExecutionStrategy } from "../../src/strategies/RetryingExecutionStrategy.js";
import { StandardExecutionStrategy } from "../../src/strategies/StandardExecutionStrategy.js";
import { TaskStep } from "../../src/TaskStep.js";
import { IExecutionStrategy } from "../../src/strategies/IExecutionStrategy.js";

describe("RetryingExecutionStrategy - Conditional Retries", () => {
  let innerStrategy: IExecutionStrategy<unknown>;
  let retryingStrategy: RetryingExecutionStrategy<unknown>;

  beforeEach(() => {
    innerStrategy = new StandardExecutionStrategy();
    retryingStrategy = new RetryingExecutionStrategy(innerStrategy);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("should retry if shouldRetry returns true", async () => {
    const runMock = vi
      .fn()
      .mockResolvedValueOnce({ status: "failure", error: "TransientError" })
      .mockResolvedValueOnce({ status: "failure", error: "TransientError" })
      .mockResolvedValueOnce({ status: "success" });

    const task: TaskStep<unknown> = {
      name: "task1",
      retry: {
        attempts: 3,
        delay: 100,
        shouldRetry: () => true,
      },
      run: runMock,
    };

    const promise = retryingStrategy.execute(task, {});

    await vi.advanceTimersByTimeAsync(0);
    expect(runMock).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(100);
    expect(runMock).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(100);
    expect(runMock).toHaveBeenCalledTimes(3);

    const result = await promise;
    expect(result.status).toBe("success");
    expect(runMock).toHaveBeenCalledTimes(3);
  });

  it("should not retry if shouldRetry returns false", async () => {
    const runMock = vi
      .fn()
      .mockResolvedValueOnce({ status: "failure", error: "FatalError" })
      .mockResolvedValueOnce({ status: "success" }); // This should never be reached

    const task: TaskStep<unknown> = {
      name: "task1",
      retry: {
        attempts: 3,
        delay: 100,
        shouldRetry: (error) => error !== "FatalError",
      },
      run: runMock,
    };

    const promise = retryingStrategy.execute(task, {});

    await vi.advanceTimersByTimeAsync(0);
    expect(runMock).toHaveBeenCalledTimes(1);

    // After first attempt, shouldRetry evaluates to false, so it should resolve immediately
    const result = await promise;
    expect(result.status).toBe("failure");
    expect(result.error).toBe("FatalError");

    // No more calls
    await vi.advanceTimersByTimeAsync(100);
    expect(runMock).toHaveBeenCalledTimes(1);
  });

  it("should fallback to legacy behavior (retry) if shouldRetry is undefined", async () => {
    const runMock = vi
      .fn()
      .mockResolvedValueOnce({ status: "failure", error: "AnyError" })
      .mockResolvedValueOnce({ status: "failure", error: "AnyError" })
      .mockResolvedValueOnce({ status: "success" });

    const task: TaskStep<unknown> = {
      name: "task1",
      retry: {
        attempts: 3,
        delay: 100,
        // shouldRetry is undefined
      },
      run: runMock,
    };

    const promise = retryingStrategy.execute(task, {});

    await vi.advanceTimersByTimeAsync(0);
    expect(runMock).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(100);
    expect(runMock).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(100);
    expect(runMock).toHaveBeenCalledTimes(3);

    const result = await promise;
    expect(result.status).toBe("success");
    expect(runMock).toHaveBeenCalledTimes(3);
  });
});
