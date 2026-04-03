import { describe, it, expect, vi } from "vitest";
import { CachingExecutionStrategy } from "../src/strategies/CachingExecutionStrategy.js";
import { IExecutionStrategy } from "../src/strategies/IExecutionStrategy.js";
import { TaskStep } from "../src/TaskStep.js";
import { MemoryCacheProvider } from "../src/utils/MemoryCacheProvider.js";

describe("CachingExecutionStrategy", () => {
  it("should execute inner strategy if cache is not configured", async () => {
    const mockStrategy: IExecutionStrategy<unknown> = {
      execute: vi.fn().mockResolvedValue({ status: "success" }),
    };
    const cacheProvider = new MemoryCacheProvider();
    const cachingStrategy = new CachingExecutionStrategy(mockStrategy, cacheProvider);

    const step: TaskStep<unknown> = {
      name: "task1",
      run: vi.fn(),
    };

    const result = await cachingStrategy.execute(step, {});

    expect(mockStrategy.execute).toHaveBeenCalled();
    expect(result.status).toBe("success");
  });

  it("should cache successful execution results", async () => {
    const mockStrategy: IExecutionStrategy<unknown> = {
      execute: vi.fn().mockResolvedValue({ status: "success", data: "result_data" }),
    };
    const cacheProvider = new MemoryCacheProvider();
    const cachingStrategy = new CachingExecutionStrategy(mockStrategy, cacheProvider);

    const step: TaskStep<unknown> = {
      name: "task1",
      cache: {
        key: () => "my_cache_key",
      },
      run: vi.fn(),
    };

    const result = await cachingStrategy.execute(step, {});

    expect(mockStrategy.execute).toHaveBeenCalledTimes(1);
    expect(result.status).toBe("success");

    const cached = await cacheProvider.get("my_cache_key");
    expect(cached).toBeDefined();
    expect(cached?.data).toBe("result_data");
  });

  it("should not cache failed execution results", async () => {
    const mockStrategy: IExecutionStrategy<unknown> = {
      execute: vi.fn().mockResolvedValue({ status: "failure", error: "failed" }),
    };
    const cacheProvider = new MemoryCacheProvider();
    const cachingStrategy = new CachingExecutionStrategy(mockStrategy, cacheProvider);

    const step: TaskStep<unknown> = {
      name: "task1",
      cache: {
        key: () => "my_cache_key",
      },
      run: vi.fn(),
    };

    const result = await cachingStrategy.execute(step, {});

    expect(mockStrategy.execute).toHaveBeenCalledTimes(1);
    expect(result.status).toBe("failure");

    const cached = await cacheProvider.get("my_cache_key");
    expect(cached).toBeUndefined();
  });

  it("should return cached result with status 'skipped' on cache hit with restore function", async () => {
    const mockStrategy: IExecutionStrategy<unknown> = {
      execute: vi.fn(),
    };
    const cacheProvider = new MemoryCacheProvider();
    await cacheProvider.set("my_cache_key", { status: "success", data: "cached_data" });

    const cachingStrategy = new CachingExecutionStrategy(mockStrategy, cacheProvider);

    const restoreFn = vi.fn();
    const step: TaskStep<unknown> = {
      name: "task1",
      cache: {
        key: () => "my_cache_key",
        restore: restoreFn,
      },
      run: vi.fn(),
    };

    const context = { state: 1 };
    const result = await cachingStrategy.execute(step, context);

    expect(mockStrategy.execute).not.toHaveBeenCalled();
    expect(result.status).toBe("skipped");
    expect(result.data).toBe("cached_data");

    // verify restore was called with context and cachedResult
    expect(restoreFn).toHaveBeenCalledWith(context, { status: "success", data: "cached_data" });
  });

  it("should return cached result with status 'skipped' on cache hit without restore function", async () => {
    const mockStrategy: IExecutionStrategy<unknown> = {
      execute: vi.fn(),
    };
    const cacheProvider = new MemoryCacheProvider();
    await cacheProvider.set("my_cache_key", { status: "success", data: "cached_data" });

    const cachingStrategy = new CachingExecutionStrategy(mockStrategy, cacheProvider);

    const step: TaskStep<unknown> = {
      name: "task1",
      cache: {
        key: () => "my_cache_key",
      },
      run: vi.fn(),
    };

    const context = { state: 1 };
    const result = await cachingStrategy.execute(step, context);

    expect(mockStrategy.execute).not.toHaveBeenCalled();
    expect(result.status).toBe("skipped");
    expect(result.data).toBe("cached_data");
  });

  it("should use TTL when caching", async () => {
    const mockStrategy: IExecutionStrategy<unknown> = {
      execute: vi.fn().mockResolvedValue({ status: "success", data: "result_data" }),
    };
    const cacheProvider = new MemoryCacheProvider();
    vi.spyOn(cacheProvider, "set");

    const cachingStrategy = new CachingExecutionStrategy(mockStrategy, cacheProvider);

    const step: TaskStep<unknown> = {
      name: "task1",
      cache: {
        key: () => "my_cache_key",
        ttl: 500,
      },
      run: vi.fn(),
    };

    await cachingStrategy.execute(step, {});

    expect(cacheProvider.set).toHaveBeenCalledWith("my_cache_key", { status: "success", data: "result_data" }, 500);
  });
});
