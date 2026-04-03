import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MemoryCacheProvider } from "../src/utils/MemoryCacheProvider.js";
import { TaskResult } from "../src/TaskResult.js";

describe("MemoryCacheProvider", () => {
  let provider: MemoryCacheProvider;

  beforeEach(() => {
    provider = new MemoryCacheProvider();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should store and retrieve a value", async () => {
    const result: TaskResult = { status: "success", data: "test" };
    await provider.set("key1", result);

    const retrieved = await provider.get("key1");
    expect(retrieved).toEqual(result);
  });

  it("should return undefined for a missing key", async () => {
    const retrieved = await provider.get("missing_key");
    expect(retrieved).toBeUndefined();
  });

  it("should expire a value based on TTL", async () => {
    const result: TaskResult = { status: "success" };
    await provider.set("key_ttl", result, 100);

    // Right away, it should be there
    expect(await provider.get("key_ttl")).toBeDefined();

    // Advance time past TTL
    vi.advanceTimersByTime(150);

    // Should be expired and removed
    expect(await provider.get("key_ttl")).toBeUndefined();
  });

  it("should delete a value", async () => {
    const result: TaskResult = { status: "success" };
    await provider.set("key_delete", result);

    expect(await provider.get("key_delete")).toBeDefined();

    await provider.delete("key_delete");

    expect(await provider.get("key_delete")).toBeUndefined();
  });
});
