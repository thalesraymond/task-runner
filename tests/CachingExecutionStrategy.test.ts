import { describe, it, expect, vi, beforeEach } from "vitest";
import { CachingExecutionStrategy } from "../src/strategies/CachingExecutionStrategy.js";
import { IExecutionStrategy } from "../src/strategies/IExecutionStrategy.js";
import { MemoryCacheProvider } from "../src/utils/MemoryCacheProvider.js";
import { TaskStep } from "../src/TaskStep.js";

interface TestContext {
  myCtx?: boolean;
}

describe("CachingExecutionStrategy", () => {
  let innerStrategy: IExecutionStrategy<TestContext>;
  let cacheProvider: MemoryCacheProvider;
  let strategy: CachingExecutionStrategy<TestContext>;

  beforeEach(() => {
    innerStrategy = {
      execute: vi.fn(),
    };
    cacheProvider = new MemoryCacheProvider();
    strategy = new CachingExecutionStrategy(innerStrategy, cacheProvider);
  });

  it("should bypass cache if task has no cache config", async () => {
    const step: TaskStep<TestContext> = {
      name: "no_cache",
      run: async () => ({ status: "success" }),
    };

    vi.mocked(innerStrategy.execute).mockResolvedValue({ status: "success" });

    const result = await strategy.execute(step, {});

    expect(result.status).toBe("success");
    expect(innerStrategy.execute).toHaveBeenCalledTimes(1);
    expect(await cacheProvider.get("any")).toBeUndefined();
  });

  it("should execute inner strategy and cache result on cache miss", async () => {
    const step: TaskStep<TestContext> = {
      name: "miss_cache",
      cache: {
        key: () => "my_key",
      },
      run: async () => ({ status: "success" }),
    };

    vi.mocked(innerStrategy.execute).mockResolvedValue({
      status: "success",
      data: "computed_data",
    });

    const result = await strategy.execute(step, {});

    expect(result.status).toBe("success");
    expect(innerStrategy.execute).toHaveBeenCalledTimes(1);

    const cached = await cacheProvider.get("my_key");
    expect(cached).toBeDefined();
    expect(cached?.data).toBe("computed_data");
  });

  it("should return cached result and skip execution on cache hit without restore fn", async () => {
    const step: TaskStep<TestContext> = {
      name: "hit_cache_no_restore",
      cache: {
        key: () => "hit_key_no_restore",
      },
      run: async () => ({ status: "success" }),
    };

    await cacheProvider.set("hit_key_no_restore", {
      status: "success",
      data: "cached_data_no_restore",
    });

    const context = { myCtx: true };
    const result = await strategy.execute(step, context);

    expect(result.status).toBe("cached");
    expect(result.data).toBe("cached_data_no_restore");
    expect(innerStrategy.execute).not.toHaveBeenCalled();
  });

  it("should not cache result if execution fails", async () => {
    const step: TaskStep<TestContext> = {
      name: "fail_cache",
      cache: {
        key: () => "fail_key",
      },
      run: async () => ({ status: "failure" }),
    };

    vi.mocked(innerStrategy.execute).mockResolvedValue({ status: "failure" });

    const result = await strategy.execute(step, {});

    expect(result.status).toBe("failure");
    expect(innerStrategy.execute).toHaveBeenCalledTimes(1);

    const cached = await cacheProvider.get("fail_key");
    expect(cached).toBeUndefined();
  });

  it("should return cached result and skip execution on cache hit", async () => {
    const restoreMock = vi.fn();
    const step: TaskStep<TestContext> = {
      name: "hit_cache",
      cache: {
        key: () => "hit_key",
        restore: restoreMock,
      },
      run: async () => ({ status: "success" }),
    };

    await cacheProvider.set("hit_key", {
      status: "success",
      data: "cached_data",
    });

    const context = { myCtx: true };
    const result = await strategy.execute(step, context);

    expect(result.status).toBe("cached");
    expect(result.data).toBe("cached_data");
    expect(innerStrategy.execute).not.toHaveBeenCalled();
    expect(restoreMock).toHaveBeenCalledWith(context, {
      status: "success",
      data: "cached_data",
    });
  });
});
