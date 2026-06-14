import { describe, it, expect } from "vitest";
import { PriorityQueue } from "../src/utils/PriorityQueue.js";

describe("PriorityQueue surviving mutants", () => {
  it("kills ConditionalExpression mutant at line 75", () => {
    const queue = new PriorityQueue<string>();
    queue.push("A", 100);
    queue.push("B", 10);
    queue.push("C", 5);
    queue.push("D", 50);
    queue.pop();
    expect(queue.pop()).toBe("D");
  });

  it("kills EqualityOperator mutant at line 75", () => {
    const queue = new PriorityQueue<string>();
    queue.push("A", 100); // 0
    queue.push("B", 10);  // 1
    queue.push("C", 50);  // 2
    queue.push("D", 5);   // 3
    queue.push("E", 6);   // 4

    // @ts-expect-error bypass private field
    const heap = queue.heap;
    // Set E's priority to 50, and sequenceId to match C's
    heap[4].priority = 50;
    heap[4].sequenceId = heap[2].sequenceId;

    queue.pop();
    expect(queue.pop()).toBe("E");
  });

  it("kills ConditionalExpression mutant at line 76", () => {
    const queue = new PriorityQueue<string>();
    queue.push("A", 100);
    queue.push("B", 10); // left
    queue.push("C", 20); // right -> 20 > 10
    queue.push("D", 50); // next root
    queue.pop();
    expect(queue.pop()).toBe("D");
  });

  it("kills EqualityOperator mutant at line 65", () => {
    const queue = new PriorityQueue<string>();
    queue.push("A", 100);
    queue.push("B", 10);
    queue.push("C", 5);
    queue.push("D", 50);

    // @ts-expect-error bypass private field
    const heap = queue.heap;
    // B is at index 3. D is at index 1.
    heap[3].priority = 50;
    heap[3].sequenceId = heap[1].sequenceId;

    queue.pop();
    expect(queue.pop()).toBe("B");
  });

  it("kills EqualityOperator mutant at line 46", () => {
    const queue = new PriorityQueue<string>();
    // @ts-expect-error bypass private field
    queue.sequenceCounter = 1;
    queue.push("A", 10);
    // @ts-expect-error bypass private field
    queue.sequenceCounter = 1;
    queue.push("B", 10);
    expect(queue.pop()).toBe("A");
  });
});
