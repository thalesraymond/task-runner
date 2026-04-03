import { describe, it, expect } from "vitest";
import { MemoryCacheProvider } from "../src/utils/MemoryCacheProvider.js";
import { TaskResult } from "../src/TaskResult.js";

describe("MemoryCacheProvider", () => {
  it("should set and get a cached item", async () => {
    const cache = new MemoryCacheProvider();
    const result: TaskResult = { status: "success", data: "test" };

    await cache.set("key1", result);
    const cached = await cache.get("key1");

    expect(cached).toEqual(result);
  });

  it("should return undefined for a missing item", async () => {
    const cache = new MemoryCacheProvider();
    const cached = await cache.get("missing_key");

    expect(cached).toBeUndefined();
  });

  it("should delete a cached item", async () => {
    const cache = new MemoryCacheProvider();
    const result: TaskResult = { status: "success", data: "test" };

    await cache.set("key1", result);
    await cache.delete("key1");
    const cached = await cache.get("key1");

    expect(cached).toBeUndefined();
  });

  it("should expire an item based on TTL", async () => {
    const cache = new MemoryCacheProvider();
    const result: TaskResult = { status: "success", data: "test" };

    await cache.set("key1", result, 100); // 100ms TTL

    // Immediately available
    let cached = await cache.get("key1");
    expect(cached).toEqual(result);

    // Wait for expiration
    await new Promise((resolve) => setTimeout(resolve, 150));

    cached = await cache.get("key1");
    expect(cached).toBeUndefined();
  });

  it("should not expire an item if TTL is not provided", async () => {
    const cache = new MemoryCacheProvider();
    const result: TaskResult = { status: "success", data: "test" };

    await cache.set("key1", result);

    // Wait for a little bit
    await new Promise((resolve) => setTimeout(resolve, 50));

    const cached = await cache.get("key1");
    expect(cached).toEqual(result);
  });
});
