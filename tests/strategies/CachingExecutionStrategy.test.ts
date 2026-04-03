import { describe, it, expect, vi, beforeEach } from "vitest";
import { CachingExecutionStrategy } from "../../src/strategies/CachingExecutionStrategy.js";
import { IExecutionStrategy } from "../../src/strategies/IExecutionStrategy.js";
import { ICacheProvider } from "../../src/contracts/ICacheProvider.js";
import { TaskStep } from "../../src/TaskStep.js";
import { TaskResult } from "../../src/TaskResult.js";

describe("CachingExecutionStrategy", () => {
  let mockInnerStrategy: IExecutionStrategy<unknown>;
  let mockCacheProvider: ICacheProvider;
  let strategy: CachingExecutionStrategy<unknown>;

  beforeEach(() => {
    mockInnerStrategy = {
      execute: vi.fn(),
    };
    mockCacheProvider = {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
    };
    strategy = new CachingExecutionStrategy(mockInnerStrategy, mockCacheProvider);
  });

  it("should bypass caching if step.cache is not configured", async () => {
    const step: TaskStep<unknown> = {
      name: "task1",
      run: vi.fn(),
    };
    const context = { data: 1 };
    const result: TaskResult = { status: "success" };

    vi.mocked(mockInnerStrategy.execute).mockResolvedValue(result);

    const out = await strategy.execute(step, context);

    expect(mockInnerStrategy.execute).toHaveBeenCalledWith(step, context, undefined);
    expect(mockCacheProvider.get).not.toHaveBeenCalled();
    expect(out).toBe(result);
  });

  it("should return cached result and skip execution on cache hit", async () => {
    const step: TaskStep<unknown> = {
      name: "task1",
      run: vi.fn(),
      cache: {
        key: () => "my-key",
      },
    };
    const context = { data: 1 };
    const cachedResult: TaskResult = { status: "success", data: "cached-data" };

    vi.mocked(mockCacheProvider.get).mockResolvedValue(cachedResult);

    const out = await strategy.execute(step, context);

    expect(mockCacheProvider.get).toHaveBeenCalledWith("my-key");
    expect(mockInnerStrategy.execute).not.toHaveBeenCalled();
    expect(out).toEqual({ ...cachedResult, status: "skipped" });
  });

  it("should call restore function on cache hit if provided", async () => {
    const restoreMock = vi.fn();
    const step: TaskStep<unknown> = {
      name: "task1",
      run: vi.fn(),
      cache: {
        key: () => "my-key",
        restore: restoreMock,
      },
    };
    const context = { data: 1 };
    const cachedResult: TaskResult = { status: "success", data: "cached-data" };

    vi.mocked(mockCacheProvider.get).mockResolvedValue(cachedResult);

    await strategy.execute(step, context);

    expect(restoreMock).toHaveBeenCalledWith(context, cachedResult);
  });

  it("should execute and store result on cache miss (success)", async () => {
    const step: TaskStep<unknown> = {
      name: "task1",
      run: vi.fn(),
      cache: {
        key: () => "my-key",
        ttl: 5000,
      },
    };
    const context = { data: 1 };
    const freshResult: TaskResult = { status: "success", data: "fresh" };

    vi.mocked(mockCacheProvider.get).mockResolvedValue(undefined);
    vi.mocked(mockInnerStrategy.execute).mockResolvedValue(freshResult);

    const out = await strategy.execute(step, context);

    expect(mockCacheProvider.get).toHaveBeenCalledWith("my-key");
    expect(mockInnerStrategy.execute).toHaveBeenCalledWith(step, context, undefined);
    expect(mockCacheProvider.set).toHaveBeenCalledWith("my-key", freshResult, 5000);
    expect(out).toBe(freshResult);
  });

  it("should execute but NOT store result on cache miss if execution fails", async () => {
    const step: TaskStep<unknown> = {
      name: "task1",
      run: vi.fn(),
      cache: {
        key: () => "my-key",
      },
    };
    const context = { data: 1 };
    const failureResult: TaskResult = { status: "failure", error: "oops" };

    vi.mocked(mockCacheProvider.get).mockResolvedValue(undefined);
    vi.mocked(mockInnerStrategy.execute).mockResolvedValue(failureResult);

    const out = await strategy.execute(step, context);

    expect(mockCacheProvider.get).toHaveBeenCalledWith("my-key");
    expect(mockInnerStrategy.execute).toHaveBeenCalledWith(step, context, undefined);
    expect(mockCacheProvider.set).not.toHaveBeenCalled();
    expect(out).toBe(failureResult);
  });
});
