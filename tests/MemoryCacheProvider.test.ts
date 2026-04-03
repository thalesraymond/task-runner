import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { MemoryCacheProvider } from "../src/utils/MemoryCacheProvider.js";
import { TaskResult } from "../src/TaskResult.js";

describe("MemoryCacheProvider", () => {
  let provider: MemoryCacheProvider;

  beforeEach(() => {
    provider = new MemoryCacheProvider();
  });

  it("should return undefined for a missing key", () => {
    expect(provider.get("missing")).toBeUndefined();
  });

  it("should set and get a value", () => {
    const result: TaskResult = { status: "success", data: "test" };
    provider.set("key1", result);
    expect(provider.get("key1")).toEqual(result);
  });

  it("should delete a value", () => {
    const result: TaskResult = { status: "success" };
    provider.set("key1", result);
    provider.delete("key1");
    expect(provider.get("key1")).toBeUndefined();
  });

  it("should clear all values", () => {
    provider.set("k1", { status: "success" });
    provider.set("k2", { status: "success" });
    provider.clear();
    expect(provider.get("k1")).toBeUndefined();
    expect(provider.get("k2")).toBeUndefined();
  });

  describe("TTL handling", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should return the value before TTL expires", () => {
      const result: TaskResult = { status: "success" };
      provider.set("k1", result, 1000);
      vi.advanceTimersByTime(500);
      expect(provider.get("k1")).toEqual(result);
    });

    it("should return undefined after TTL expires", () => {
      const result: TaskResult = { status: "success" };
      provider.set("k1", result, 1000);
      vi.advanceTimersByTime(1500);
      expect(provider.get("k1")).toBeUndefined();
    });
  });
});
