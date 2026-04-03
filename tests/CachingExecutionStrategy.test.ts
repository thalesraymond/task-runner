import { describe, it, expect, vi, beforeEach } from "vitest";
import { CachingExecutionStrategy } from "../src/strategies/CachingExecutionStrategy.js";
import { IExecutionStrategy } from "../src/strategies/IExecutionStrategy.js";
import { ICacheProvider } from "../src/contracts/ICacheProvider.js";
import { TaskStep } from "../src/TaskStep.js";
import { TaskResult } from "../src/TaskResult.js";

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

  it("should bypass caching if step has no cache config", async () => {
    const step: TaskStep<unknown> = {
      name: "no-cache",
      run: vi.fn(),
    };
    const context = {};
    const expectedResult: TaskResult = { status: "success" };

    vi.mocked(mockInnerStrategy.execute).mockResolvedValueOnce(expectedResult);

    const result = await strategy.execute(step, context);
    expect(result).toBe(expectedResult);
    expect(mockCacheProvider.get).not.toHaveBeenCalled();
    expect(mockCacheProvider.set).not.toHaveBeenCalled();
  });

  it("should return cached result and call restore if cache hit", async () => {
    const restoreMock = vi.fn();
    const step: TaskStep<unknown> = {
      name: "cached-step",
      run: vi.fn(),
      cache: {
        key: () => "test-key",
        restore: restoreMock,
      },
    };
    const context = {};
    const cachedResult: TaskResult = { status: "success", data: "cached" };

    vi.mocked(mockCacheProvider.get).mockResolvedValueOnce(cachedResult);

    const result = await strategy.execute(step, context);

    expect(mockInnerStrategy.execute).not.toHaveBeenCalled();
    expect(restoreMock).toHaveBeenCalledWith(context, cachedResult);
    expect(result).toEqual({ status: "skipped", data: "cached" });
  });

  it("should return cached result and NOT call restore if restore is undefined", async () => {
    const step: TaskStep<unknown> = {
      name: "cached-step-no-restore",
      run: vi.fn(),
      cache: {
        key: () => "test-key",
      },
    };
    const context = {};
    const cachedResult: TaskResult = { status: "success", data: "cached" };

    vi.mocked(mockCacheProvider.get).mockResolvedValueOnce(cachedResult);

    const result = await strategy.execute(step, context);

    expect(mockInnerStrategy.execute).not.toHaveBeenCalled();
    expect(result).toEqual({ status: "skipped", data: "cached" });
  });

  it("should execute inner strategy and cache result on cache miss (success)", async () => {
    const step: TaskStep<unknown> = {
      name: "miss-step",
      run: vi.fn(),
      cache: {
        key: () => "miss-key",
        ttl: 1000,
      },
    };
    const context = {};
    const newResult: TaskResult = { status: "success", data: "new" };

    vi.mocked(mockCacheProvider.get).mockResolvedValueOnce(undefined);
    vi.mocked(mockInnerStrategy.execute).mockResolvedValueOnce(newResult);

    const result = await strategy.execute(step, context);

    expect(result).toBe(newResult);
    expect(mockInnerStrategy.execute).toHaveBeenCalledWith(step, context, undefined);
    expect(mockCacheProvider.set).toHaveBeenCalledWith("miss-key", newResult, 1000);
  });

  it("should execute inner strategy but NOT cache result on cache miss (failure)", async () => {
    const step: TaskStep<unknown> = {
      name: "fail-step",
      run: vi.fn(),
      cache: {
        key: () => "fail-key",
      },
    };
    const context = {};
    const newResult: TaskResult = { status: "failure", error: "oops" };

    vi.mocked(mockCacheProvider.get).mockResolvedValueOnce(undefined);
    vi.mocked(mockInnerStrategy.execute).mockResolvedValueOnce(newResult);

    const result = await strategy.execute(step, context);

    expect(result).toBe(newResult);
    expect(mockCacheProvider.set).not.toHaveBeenCalledWith("fail-key", expect.anything(), expect.anything());
  });
});
