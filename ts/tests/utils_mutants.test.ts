import { describe, it, expect, vi } from "vitest";
import { PriorityQueue } from "../src/utils/PriorityQueue.js";
import { sleep } from "../src/utils/sleep.js";

describe("PriorityQueue Mutants", () => {
  it("should handle peek when empty", () => {
    const queue = new PriorityQueue();
    expect(queue.peek()).toBeUndefined();
  });

  it("should handle pop when empty", () => {
    const queue = new PriorityQueue();
    expect(queue.pop()).toBeUndefined();
  });

  it("should trigger sinkDown with right child swap over left child", () => {
    const queue = new PriorityQueue<number>();
    queue.push(30, 30);
    queue.push(15, 15);
    queue.push(20, 20);
    queue.push(5, 5);
    expect(queue.pop()).toBe(30);
    expect(queue.peek()).toBe(20);
  });

  it("should handle same priority elements correctly based on sequence ID during sinkDown", () => {
    const queue = new PriorityQueue<string>();
    queue.push("A", 30); // seq 0
    queue.push("B", 20); // seq 1
    queue.push("C", 20); // seq 2
    queue.push("D", 5);  // seq 3
    queue.pop();
    expect(queue.peek()).toBe("B");
  });

  it("should trigger swapIndex === null && rightChild > element", () => {
    const queue = new PriorityQueue<number>();
    queue.push(20, 20); // out first
    queue.push(2, 2);   // left child
    queue.push(10, 10); // right child
    queue.push(5, 5);   // becomes root after pop
    expect(queue.pop()).toBe(20);
    expect(queue.peek()).toBe(10);
  });

  it("should have correct size and isEmpty behavior", () => {
    const queue = new PriorityQueue();
    expect(queue.isEmpty()).toBe(true);
    expect(queue.size()).toBe(0);

    queue.push("A", 1);
    expect(queue.isEmpty()).toBe(false);
    expect(queue.size()).toBe(1);
  });

  it("should clear the queue completely", () => {
    const queue = new PriorityQueue();
    queue.push("A", 1);
    queue.clear();
    expect(queue.isEmpty()).toBe(true);
    expect(queue.size()).toBe(0);
  });

  it("should handle pop when queue has 1 element", () => {
    const queue = new PriorityQueue();
    queue.push("A", 1);
    expect(queue.pop()).toBe("A");
    expect(queue.isEmpty()).toBe(true);
  });

  it("should break sinkDown when swapIndex === null early", () => {
      const queue = new PriorityQueue<string>();
      queue.push("A", 10);
      queue.push("B", 5);
      queue.push("C", 5);
      queue.push("D", 2);
      expect(queue.pop()).toBe("A");
  });
});

describe("sleep Mutants", () => {
  it("should return immediately if ms <= 0", async () => {
    const start = performance.now();
    await sleep(0);
    expect(performance.now() - start).toBeLessThan(5);
  });

  it("should reject with generic AbortError message on initial abort check", async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(sleep(10, controller.signal)).rejects.toThrow("AbortError");
  });

  it("should reject with generic AbortError message on abort during sleep", async () => {
    const controller = new AbortController();
    const sleepPromise = sleep(50, controller.signal);

    setTimeout(() => {
        controller.abort();
    }, 10);

    await expect(sleepPromise).rejects.toThrow("AbortError");
  });

  it("should cleanup event listener without empty string", async () => {
    const controller = new AbortController();
    const removeSpy = vi.spyOn(controller.signal, "removeEventListener");

    const sleepPromise = sleep(50, controller.signal);

    setTimeout(() => {
        controller.abort();
    }, 10);

    await expect(sleepPromise).rejects.toThrow("AbortError");

    expect(removeSpy).toHaveBeenCalledWith("abort", expect.any(Function));
    expect(removeSpy).not.toHaveBeenCalledWith("", expect.any(Function));
  });

  it("should call cleanup when sleep finishes", async () => {
    const controller = new AbortController();
    const removeSpy = vi.spyOn(controller.signal, "removeEventListener");

    await sleep(10, controller.signal);

    expect(removeSpy).toHaveBeenCalledWith("abort", expect.any(Function));
  });
});
