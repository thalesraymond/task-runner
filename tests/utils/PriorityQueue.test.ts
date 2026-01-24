import { describe, it, expect, beforeEach } from "vitest";
import { PriorityQueue } from "../../src/utils/PriorityQueue.js";

describe("PriorityQueue", () => {
  let pq: PriorityQueue<string>;

  beforeEach(() => {
    pq = new PriorityQueue<string>();
  });

  it("should start empty", () => {
    expect(pq.size()).toBe(0);
    expect(pq.isEmpty()).toBe(true);
    expect(pq.peek()).toBeUndefined();
    expect(pq.pop()).toBeUndefined();
  });

  it("should push and pop items based on priority", () => {
    pq.push("low", 1);
    pq.push("high", 10);
    pq.push("medium", 5);

    expect(pq.size()).toBe(3);
    expect(pq.isEmpty()).toBe(false);
    expect(pq.peek()).toBe("high");

    expect(pq.pop()).toBe("high");
    expect(pq.peek()).toBe("medium");

    expect(pq.pop()).toBe("medium");
    expect(pq.peek()).toBe("low");

    expect(pq.pop()).toBe("low");
    expect(pq.isEmpty()).toBe(true);
  });

  it("should maintain stability for items with equal priority", () => {
    pq.push("first", 5);
    pq.push("second", 5);
    pq.push("third", 5);

    expect(pq.pop()).toBe("first");
    expect(pq.pop()).toBe("second");
    expect(pq.pop()).toBe("third");
  });

  it("should handle mixed priorities and stability", () => {
    pq.push("A1", 10);
    pq.push("B1", 5);
    pq.push("A2", 10);
    pq.push("B2", 5);

    expect(pq.pop()).toBe("A1");
    expect(pq.pop()).toBe("A2");
    expect(pq.pop()).toBe("B1");
    expect(pq.pop()).toBe("B2");
  });

  it("should clear the queue", () => {
    pq.push("item", 1);
    expect(pq.size()).toBe(1);

    pq.clear();
    expect(pq.size()).toBe(0);
    expect(pq.isEmpty()).toBe(true);
    expect(pq.peek()).toBeUndefined();
  });

  it("should handle single item push/pop correctly", () => {
    pq.push("one", 1);
    expect(pq.peek()).toBe("one");
    expect(pq.pop()).toBe("one");
    expect(pq.size()).toBe(0);
  });
});
