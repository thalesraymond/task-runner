import { describe, it, expect, vi, beforeEach } from "vitest";
import { CachingExecutionStrategy } from "../src/strategies/CachingExecutionStrategy.js";
import { IExecutionStrategy } from "../src/strategies/IExecutionStrategy.js";
import { ICacheProvider } from "../src/contracts/ICacheProvider.js";
import { TaskStep } from "../src/TaskStep.js";
import { TaskResult } from "../src/TaskResult.js";

describe("CachingExecutionStrategy", () => {
  let innerStrategy: IExecutionStrategy<unknown>;
  let cacheProvider: ICacheProvider;
  let strategy: CachingExecutionStrategy<unknown>;
  let context: unknown;

  beforeEach(() => {
    innerStrategy = {
      execute: vi.fn(),
    };
    cacheProvider = {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
    };
    strategy = new CachingExecutionStrategy(innerStrategy, cacheProvider);
    context = {};
  });

  it("should execute inner strategy directly if step has no cache config", async () => {
    const step: TaskStep<unknown> = {
      name: "task1",
      run: vi.fn(),
    };
    const mockResult: TaskResult = { status: "success" };
    vi.mocked(innerStrategy.execute).mockResolvedValue(mockResult);

    const result = await strategy.execute(step, context);

    expect(result).toBe(mockResult);
    expect(innerStrategy.execute).toHaveBeenCalledWith(step, context, undefined);
    expect(cacheProvider.get).not.toHaveBeenCalled();
    expect(cacheProvider.set).not.toHaveBeenCalled();
  });

  it("should return cached result and status skipped on cache hit", async () => {
    const step: TaskStep<unknown> = {
      name: "task1",
      cache: {
        key: () => "my-key",
      },
      run: vi.fn(),
    };
    const cachedResult: TaskResult = { status: "success", data: "cached" };
    vi.mocked(cacheProvider.get).mockResolvedValue(cachedResult);

    const result = await strategy.execute(step, context);

    expect(cacheProvider.get).toHaveBeenCalledWith("my-key");
    expect(innerStrategy.execute).not.toHaveBeenCalled();
    expect(result).toEqual({ ...cachedResult, status: "skipped" });
  });

  it("should execute restore function on cache hit if provided", async () => {
    const restoreFn = vi.fn();
    const step: TaskStep<unknown> = {
      name: "task1",
      cache: {
        key: () => "my-key",
        restore: restoreFn,
      },
      run: vi.fn(),
    };
    const cachedResult: TaskResult = { status: "success", data: "cached" };
    vi.mocked(cacheProvider.get).mockResolvedValue(cachedResult);

    const result = await strategy.execute(step, context);

    expect(restoreFn).toHaveBeenCalledWith(context, cachedResult);
    expect(result).toEqual({ ...cachedResult, status: "skipped" });
  });

  it("should execute inner strategy and store result on cache miss", async () => {
    const step: TaskStep<unknown> = {
      name: "task1",
      cache: {
        key: () => "my-key",
        ttl: 1000,
      },
      run: vi.fn(),
    };
    const mockResult: TaskResult = { status: "success", data: "fresh" };
    vi.mocked(cacheProvider.get).mockResolvedValue(undefined);
    vi.mocked(innerStrategy.execute).mockResolvedValue(mockResult);

    const result = await strategy.execute(step, context);

    expect(cacheProvider.get).toHaveBeenCalledWith("my-key");
    expect(innerStrategy.execute).toHaveBeenCalledWith(step, context, undefined);
    expect(cacheProvider.set).toHaveBeenCalledWith("my-key", mockResult, 1000);
    expect(result).toBe(mockResult);
  });

  it("should not store result if execution fails", async () => {
    const step: TaskStep<unknown> = {
      name: "task1",
      cache: {
        key: () => "my-key",
      },
      run: vi.fn(),
    };
    const mockResult: TaskResult = { status: "failure", error: "failed" };
    vi.mocked(cacheProvider.get).mockResolvedValue(undefined);
    vi.mocked(innerStrategy.execute).mockResolvedValue(mockResult);

    const result = await strategy.execute(step, context);

    expect(cacheProvider.set).not.toHaveBeenCalled();
    expect(result).toBe(mockResult);
  });
});
