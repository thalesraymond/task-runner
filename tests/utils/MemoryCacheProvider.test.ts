import { describe, it, expect, vi } from "vitest";
import { MemoryCacheProvider } from "../../src/utils/MemoryCacheProvider.js";
import { TaskResult } from "../../src/TaskResult.js";

describe("MemoryCacheProvider", () => {
  it("should return undefined for a missing key", async () => {
    const provider = new MemoryCacheProvider();
    const result = await provider.get("non-existent");
    expect(result).toBeUndefined();
  });

  it("should store and retrieve a value", async () => {
    const provider = new MemoryCacheProvider();
    const taskResult: TaskResult = { status: "success", data: "test" };

    await provider.set("key1", taskResult);
    const retrieved = await provider.get("key1");

    expect(retrieved).toEqual(taskResult);
  });

  it("should overwrite an existing value", async () => {
    const provider = new MemoryCacheProvider();
    const result1: TaskResult = { status: "success", data: "first" };
    const result2: TaskResult = { status: "success", data: "second" };

    await provider.set("key1", result1);
    await provider.set("key1", result2);

    const retrieved = await provider.get("key1");
    expect(retrieved).toEqual(result2);
  });

  it("should delete a value", async () => {
    const provider = new MemoryCacheProvider();
    const taskResult: TaskResult = { status: "success", data: "test" };

    await provider.set("key1", taskResult);
    await provider.delete("key1");

    const retrieved = await provider.get("key1");
    expect(retrieved).toBeUndefined();
  });

  it("should handle TTL correctly", async () => {
    vi.useFakeTimers();
    try {
      const provider = new MemoryCacheProvider();
      const taskResult: TaskResult = { status: "success", data: "test" };

      await provider.set("key1", taskResult, 1000); // 1 second TTL

      // Immediately available
      let retrieved = await provider.get("key1");
      expect(retrieved).toEqual(taskResult);

      // Advance time by 500ms
      vi.advanceTimersByTime(500);
      retrieved = await provider.get("key1");
      expect(retrieved).toEqual(taskResult);

      // Advance time by another 501ms (past TTL)
      vi.advanceTimersByTime(501);
      retrieved = await provider.get("key1");
      expect(retrieved).toBeUndefined();
    } finally {
      vi.useRealTimers();
    }
  });
});
