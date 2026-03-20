import { describe, it, expect, vi } from "vitest";
import { LoopingExecutionStrategy } from "../../src/strategies/LoopingExecutionStrategy.js";
import { IExecutionStrategy } from "../../src/strategies/IExecutionStrategy.js";
import { TaskStep } from "../../src/TaskStep.js";

describe("LoopingExecutionStrategy", () => {
  it("should not loop if loop config is not provided", async () => {
    const mockInnerStrategy: IExecutionStrategy<unknown> = {
      execute: vi.fn().mockResolvedValue({ status: "success" }),
    };
    const strategy = new LoopingExecutionStrategy(mockInnerStrategy);
    const step: TaskStep<unknown> = {
      name: "task1",
      run: vi.fn(),
    };

    const result = await strategy.execute(step, {});
    expect(result.status).toBe("success");
    expect(mockInnerStrategy.execute).toHaveBeenCalledTimes(1);
  });

  it("should loop until condition is met", async () => {
    const mockInnerStrategy: IExecutionStrategy<unknown> = {
      execute: vi.fn().mockResolvedValue({ status: "success" }),
    };
    const strategy = new LoopingExecutionStrategy(mockInnerStrategy);
    let iterations = 0;
    const step: TaskStep<unknown> = {
      name: "task1",
      run: vi.fn(),
      loop: {
        maxIterations: 5,
        until: () => {
          iterations++;
          return iterations === 3;
        },
      },
    };

    const result = await strategy.execute(step, {});
    expect(result.status).toBe("success");
    expect(mockInnerStrategy.execute).toHaveBeenCalledTimes(3);
    expect(iterations).toBe(3);
  });

  it("should fail if maxIterations is reached without condition being met", async () => {
    const mockInnerStrategy: IExecutionStrategy<unknown> = {
      execute: vi.fn().mockResolvedValue({ status: "success" }),
    };
    const strategy = new LoopingExecutionStrategy(mockInnerStrategy);
    const step: TaskStep<unknown> = {
      name: "task1",
      run: vi.fn(),
      loop: {
        maxIterations: 3,
        until: () => false,
      },
    };

    const result = await strategy.execute(step, {});
    expect(result.status).toBe("failure");
    expect(result.error).toContain("reached maximum loop iterations (3)");
    expect(mockInnerStrategy.execute).toHaveBeenCalledTimes(3);
  });

  it("should wait for interval between iterations", async () => {
    const mockInnerStrategy: IExecutionStrategy<unknown> = {
      execute: vi.fn().mockResolvedValue({ status: "success" }),
    };
    const strategy = new LoopingExecutionStrategy(mockInnerStrategy);
    let iterations = 0;
    const step: TaskStep<unknown> = {
      name: "task1",
      run: vi.fn(),
      loop: {
        interval: 10, // Wait 10ms
        maxIterations: 3,
        until: () => {
          iterations++;
          return iterations === 2;
        },
      },
    };

    const start = Date.now();
    await strategy.execute(step, {});
    const end = Date.now();

    expect(mockInnerStrategy.execute).toHaveBeenCalledTimes(2);
    // Should have waited at least 10ms once
    expect(end - start).toBeGreaterThanOrEqual(5);
  });

  it("should handle cancellation before execution", async () => {
    const mockInnerStrategy: IExecutionStrategy<unknown> = {
      execute: vi.fn(),
    };
    const strategy = new LoopingExecutionStrategy(mockInnerStrategy);
    const controller = new AbortController();
    controller.abort();

    const step: TaskStep<unknown> = {
      name: "task1",
      run: vi.fn(),
      loop: {
        until: () => false,
      },
    };

    const result = await strategy.execute(step, {}, controller.signal);
    expect(result.status).toBe("cancelled");
    expect(result.message).toBe("Task cancelled before loop iteration");
    expect(mockInnerStrategy.execute).not.toHaveBeenCalled();
  });

  it("should handle cancellation during sleep", async () => {
    const mockInnerStrategy: IExecutionStrategy<unknown> = {
      execute: vi.fn().mockResolvedValue({ status: "success" }),
    };
    const strategy = new LoopingExecutionStrategy(mockInnerStrategy);
    const controller = new AbortController();

    const step: TaskStep<unknown> = {
      name: "task1",
      run: vi.fn(),
      loop: {
        interval: 100, // Wait 100ms
        maxIterations: 5,
        until: () => false,
      },
    };

    // Abort after a short delay, during the sleep
    setTimeout(() => controller.abort(), 20);

    const result = await strategy.execute(step, {}, controller.signal);
    expect(result.status).toBe("cancelled");
    expect(result.message).toBe("Task cancelled during loop delay");
    expect(mockInnerStrategy.execute).toHaveBeenCalledTimes(1);
  });

  it("should handle error thrown by inner strategy if not cancelled", async () => {
    const error = new Error("Test error");
    const mockInnerStrategy: IExecutionStrategy<unknown> = {
      execute: vi.fn().mockRejectedValue(error),
    };
    const strategy = new LoopingExecutionStrategy(mockInnerStrategy);

    const step: TaskStep<unknown> = {
      name: "task1",
      run: vi.fn(),
      loop: {
        interval: 10,
        maxIterations: 2,
        until: () => false,
      },
    };

    await expect(strategy.execute(step, {})).rejects.toThrow("Test error");
  });

  it("should reject if aborted before sleep interval starts", async () => {
    const mockInnerStrategy: IExecutionStrategy<unknown> = {
      execute: vi.fn().mockResolvedValue({ status: "success" }),
    };
    const strategy = new LoopingExecutionStrategy(mockInnerStrategy);

    // We create a controller that we will abort before calling sleep,
    // to test the if (signal?.aborted) block inside the sleep promise.
    const controller = new AbortController();
    const step: TaskStep<unknown> = {
      name: "task1",
      run: vi.fn(),
      loop: {
        interval: 10,
        maxIterations: 2,
        until: () => false,
      },
    };

    // Replace the global execute to intercept right before sleep
    mockInnerStrategy.execute = vi.fn().mockImplementation(async () => {
      // Abort signal before returning result so that the sleep catches it immediately
      controller.abort();
      return { status: "success" };
    });

    const result = await strategy.execute(step, {}, controller.signal);
    expect(result.status).toBe("cancelled");
    expect(result.message).toBe("Task cancelled during loop delay");
  });

  it("should throw error if sleep fails but not aborted", async () => {
    const mockInnerStrategy: IExecutionStrategy<unknown> = {
      execute: vi.fn().mockResolvedValue({ status: "success" }),
    };
    const strategy = new LoopingExecutionStrategy(mockInnerStrategy);
    const step: TaskStep<unknown> = {
      name: "task1",
      run: vi.fn(),
      loop: {
        interval: 10,
        maxIterations: 2,
        until: () => false,
      },
    };

    // We can mock sleep to throw an arbitrary error, but sleep is private.
    // Instead, we can simulate an error in sleep by passing an AbortSignal that aborts, but then we manually unset `signal.aborted` using a Proxy or we stub sleep using vi.spyOn.
    const sleepSpy = vi.spyOn(strategy as unknown as { sleep: () => Promise<void> }, "sleep").mockRejectedValue(new Error("Unexpected sleep error"));

    await expect(strategy.execute(step, {})).rejects.toThrow("Unexpected sleep error");
    sleepSpy.mockRestore();
  });
});
