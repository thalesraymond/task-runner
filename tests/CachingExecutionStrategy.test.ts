import { describe, it, expect, vi } from "vitest";
import { CachingExecutionStrategy } from "../src/strategies/CachingExecutionStrategy.js";
import { MemoryCacheProvider } from "../src/utils/MemoryCacheProvider.js";
import { IExecutionStrategy } from "../src/strategies/IExecutionStrategy.js";
import { TaskStep } from "../src/TaskStep.js";

interface TestContext {
  value: number;
}

describe("CachingExecutionStrategy", () => {
  it("should execute task normally if no cache config is present", async () => {
    const mockInnerStrategy: IExecutionStrategy<TestContext> = {
      execute: vi.fn().mockResolvedValue({ status: "success", message: "Run" }),
    };
    const cacheProvider = new MemoryCacheProvider();
    const strategy = new CachingExecutionStrategy(mockInnerStrategy, cacheProvider);

    const step: TaskStep<TestContext> = {
      name: "task1",
      run: vi.fn(),
    };

    const result = await strategy.execute(step, { value: 1 });
    expect(result.status).toBe("success");
    expect(mockInnerStrategy.execute).toHaveBeenCalledTimes(1);
    expect(cacheProvider.get("task1")).toBeUndefined();
  });

  it("should cache result on success", async () => {
    const mockInnerStrategy: IExecutionStrategy<TestContext> = {
      execute: vi.fn().mockResolvedValue({ status: "success", data: "result1" }),
    };
    const cacheProvider = new MemoryCacheProvider();
    const strategy = new CachingExecutionStrategy(mockInnerStrategy, cacheProvider);

    const step: TaskStep<TestContext> = {
      name: "task1",
      cache: {
        key: () => "my-key",
      },
      run: vi.fn(),
    };

    const result = await strategy.execute(step, { value: 1 });
    expect(result.status).toBe("success");
    expect(mockInnerStrategy.execute).toHaveBeenCalledTimes(1);

    const cached = cacheProvider.get("my-key");
    expect(cached).toEqual({ status: "success", data: "result1" });
  });

  it("should not cache result on failure", async () => {
    const mockInnerStrategy: IExecutionStrategy<TestContext> = {
      execute: vi.fn().mockResolvedValue({ status: "failure", error: "fail" }),
    };
    const cacheProvider = new MemoryCacheProvider();
    const strategy = new CachingExecutionStrategy(mockInnerStrategy, cacheProvider);

    const step: TaskStep<TestContext> = {
      name: "task1",
      cache: {
        key: () => "my-key",
      },
      run: vi.fn(),
    };

    const result = await strategy.execute(step, { value: 1 });
    expect(result.status).toBe("failure");
    expect(mockInnerStrategy.execute).toHaveBeenCalledTimes(1);

    const cached = cacheProvider.get("my-key");
    expect(cached).toBeUndefined();
  });

  it("should return cached result and skip execution", async () => {
    const mockInnerStrategy: IExecutionStrategy<TestContext> = {
      execute: vi.fn(),
    };
    const cacheProvider = new MemoryCacheProvider();
    cacheProvider.set("my-key", { status: "success", data: "result1" });

    const strategy = new CachingExecutionStrategy(mockInnerStrategy, cacheProvider);

    const step: TaskStep<TestContext> = {
      name: "task1",
      cache: {
        key: () => "my-key",
      },
      run: vi.fn(),
    };

    const result = await strategy.execute(step, { value: 1 });
    expect(result.status).toBe("skipped");
    expect(result.message).toBe("Task skipped (cached)");
    expect(result.data).toBe("result1");
    expect(mockInnerStrategy.execute).not.toHaveBeenCalled();
  });

  it("should append (cached) to existing message", async () => {
    const mockInnerStrategy: IExecutionStrategy<TestContext> = {
      execute: vi.fn(),
    };
    const cacheProvider = new MemoryCacheProvider();
    cacheProvider.set("my-key", { status: "success", message: "Success!" });

    const strategy = new CachingExecutionStrategy(mockInnerStrategy, cacheProvider);

    const step: TaskStep<TestContext> = {
      name: "task1",
      cache: {
        key: () => "my-key",
      },
      run: vi.fn(),
    };

    const result = await strategy.execute(step, { value: 1 });
    expect(result.status).toBe("skipped");
    expect(result.message).toBe("Success! (cached)");
    expect(mockInnerStrategy.execute).not.toHaveBeenCalled();
  });

  it("should call restore function if provided", async () => {
    const mockInnerStrategy: IExecutionStrategy<TestContext> = {
      execute: vi.fn(),
    };
    const cacheProvider = new MemoryCacheProvider();
    cacheProvider.set("my-key", { status: "success", data: 42 });

    const strategy = new CachingExecutionStrategy(mockInnerStrategy, cacheProvider);

    const context: TestContext = { value: 1 };
    const step: TaskStep<TestContext> = {
      name: "task1",
      cache: {
        key: () => "my-key",
        restore: (ctx, res) => {
          ctx.value = res.data as number;
        },
      },
      run: vi.fn(),
    };

    await strategy.execute(step, context);
    expect(context.value).toBe(42);
    expect(mockInnerStrategy.execute).not.toHaveBeenCalled();
  });
});
