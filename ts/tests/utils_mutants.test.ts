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

  it("should handle compare exact equality gracefully", () => {
    // Since sequence IDs are unique per push, compare() NEVER returns exactly 0
    // for two different elements. To kill `>= 0` vs `> 0` mutant, we must force it.
    // We can do this by using the internal method if possible, or by mocking sequenceId
    // or we can test true/false by bypassing visibility checks to push duplicate sequenceIds
    const queue = new PriorityQueue<number>();
    // @ts-expect-error Accessing private property to force same sequenceId
    queue.sequenceCounter = 1;
    queue.push(10, 10); // root (seq 1) -> popped
    // @ts-expect-error Accessing private property
    queue.sequenceCounter = 1;
    queue.push(2, 2);   // left child (seq 1)
    // @ts-expect-error Accessing private property
    queue.sequenceCounter = 1;
    queue.push(5, 5);   // right child (seq 1)
    // @ts-expect-error Accessing private property
    queue.sequenceCounter = 1;
    queue.push(5, 5);   // next root (seq 1)

    // After pop:
    // root is D(5, seq1)
    // left is B(2, seq1) -> compare(B, D) = 2-5 = -3 < 0. swapIndex = null
    // right is C(5, seq1) -> compare(C, D) = 5-5 = 0. seq1-seq1 = 0.
    // If we use >= 0, swapIndex becomes rightChild (2).
    // If > 0, swapIndex remains null.
    // So if >= 0, root swaps with right child.
    // Meaning C becomes root, D becomes right child.
    // Pop again: if it swapped, we pop C. If not, we pop D.
    // Wait, C and D are both 5.
    // Let's use different items to distinguish:

    const queue2 = new PriorityQueue<string>();
    // @ts-expect-error Bypass
    queue2.sequenceCounter = 1;
    queue2.push("A", 10);
    // @ts-expect-error Bypass
    queue2.sequenceCounter = 1;
    queue2.push("B", 2); // left
    // @ts-expect-error Bypass
    queue2.sequenceCounter = 1;
    queue2.push("C", 5); // right
    // @ts-expect-error Bypass
    queue2.sequenceCounter = 1;
    queue2.push("D", 5); // next root

    queue2.pop(); // pops A, D becomes root
    // D is root. left is B, right is C.
    // B vs D: B(2) < D(5) -> swapIndex = null
    // C vs D: C(5) == D(5), seq == seq -> compare = 0.
    // If > 0: no swap. D is root. Next pop returns D.
    // If >= 0: swap with C. C is root. Next pop returns C.
    expect(queue2.pop()).toBe("D");
  });

  it("should handle compare exact equality when swapIndex !== null", () => {
    const queue2 = new PriorityQueue<string>();
    // @ts-expect-error Bypass
    queue2.sequenceCounter = 1;
    queue2.push("A", 10);
    // @ts-expect-error Bypass
    queue2.sequenceCounter = 1;
    queue2.push("B", 5); // left
    // @ts-expect-error Bypass
    queue2.sequenceCounter = 1;
    queue2.push("C", 5); // right
    // @ts-expect-error Bypass
    queue2.sequenceCounter = 2; // D seq=2, so B>D and C>D
    queue2.push("D", 2); // next root

    queue2.pop(); // pops A, D becomes root
    // D(2, seq2) is root. left is B(5, seq1), right is C(5, seq1).
    // B vs D: B(5) > D(2) -> swapIndex = leftChild (1)
    // C vs B: C(5) == B(5), seq1 == seq1 -> compare = 0.
    // If swapIndex !== null && compare(right, left) >= 0: swapIndex becomes rightChild (2).
    // If > 0: swapIndex remains leftChild (1).
    // So if >= 0, C becomes root. Next pop is C.
    // If > 0, B becomes root. Next pop is B.
    expect(queue2.pop()).toBe("B");
  });
});

describe("sleep Mutants", () => {
  it("should return immediately if ms <= 0", async () => {
    const start = performance.now();
    const setTimeoutSpy = vi.spyOn(global, "setTimeout");
    await sleep(0);
    expect(setTimeoutSpy).not.toHaveBeenCalled();
    await sleep(-1);
    expect(setTimeoutSpy).not.toHaveBeenCalled();
    setTimeoutSpy.mockRestore();
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
