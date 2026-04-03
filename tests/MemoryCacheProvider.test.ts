import { describe, it, expect, vi } from "vitest";
import { MemoryCacheProvider } from "../src/utils/MemoryCacheProvider.js";
import { TaskResult } from "../src/TaskResult.js";

describe("MemoryCacheProvider", () => {
  it("should return undefined for a non-existent key", () => {
    const provider = new MemoryCacheProvider();
    expect(provider.get("non-existent")).toBeUndefined();
  });

  it("should store and retrieve a value", () => {
    const provider = new MemoryCacheProvider();
    const result: TaskResult = { status: "success", message: "Hello" };
    provider.set("key1", result);
    expect(provider.get("key1")).toEqual(result);
  });

  it("should delete a value", () => {
    const provider = new MemoryCacheProvider();
    const result: TaskResult = { status: "success", message: "Hello" };
    provider.set("key1", result);
    provider.delete("key1");
    expect(provider.get("key1")).toBeUndefined();
  });

  it("should expire values after TTL", () => {
    vi.useFakeTimers();
    const provider = new MemoryCacheProvider();
    const result: TaskResult = { status: "success", message: "Hello" };

    // Set with 100ms TTL
    provider.set("key1", result, 100);
    expect(provider.get("key1")).toEqual(result);

    // Advance time by 50ms (still valid)
    vi.advanceTimersByTime(50);
    expect(provider.get("key1")).toEqual(result);

    // Advance time by another 51ms (total 101ms, expired)
    vi.advanceTimersByTime(51);
    expect(provider.get("key1")).toBeUndefined();

    vi.useRealTimers();
  });
});
