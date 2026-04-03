import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MemoryCacheProvider } from "../src/utils/MemoryCacheProvider.js";
import { TaskResult } from "../src/TaskResult.js";

describe("MemoryCacheProvider", () => {
  let cacheProvider: MemoryCacheProvider;

  beforeEach(() => {
    cacheProvider = new MemoryCacheProvider();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return undefined for a non-existent key", async () => {
    const result = await cacheProvider.get("non-existent");
    expect(result).toBeUndefined();
  });

  it("should store and retrieve a cached result", async () => {
    const mockResult: TaskResult = { status: "success", data: "test" };
    await cacheProvider.set("key1", mockResult);

    const result = await cacheProvider.get("key1");
    expect(result).toEqual(mockResult);
    expect(result).not.toBe(mockResult); // Should be a clone
  });

  it("should respect ttl and expire results", async () => {
    const mockResult: TaskResult = { status: "success" };
    await cacheProvider.set("key2", mockResult, 1000); // 1 second TTL

    let result = await cacheProvider.get("key2");
    expect(result).toEqual(mockResult);

    vi.advanceTimersByTime(1500);

    result = await cacheProvider.get("key2");
    expect(result).toBeUndefined();
  });

  it("should not expire results if ttl is not provided", async () => {
    const mockResult: TaskResult = { status: "success" };
    await cacheProvider.set("key3", mockResult);

    vi.advanceTimersByTime(100000); // Advance by a long time

    const result = await cacheProvider.get("key3");
    expect(result).toEqual(mockResult);
  });

  it("should delete a cached result", async () => {
    const mockResult: TaskResult = { status: "success" };
    await cacheProvider.set("key4", mockResult);

    await cacheProvider.delete("key4");

    const result = await cacheProvider.get("key4");
    expect(result).toBeUndefined();
  });
});
