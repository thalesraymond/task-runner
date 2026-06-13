import { describe, it, expect } from "vitest";
import { PriorityQueue } from "../src/utils/PriorityQueue.js";

describe("PriorityQueue Additional Mutants", () => {
  it("should break bubbleUp when compare is exactly 0", () => {
    const queue2 = new PriorityQueue<string>();
    // @ts-expect-error bypass private field
    queue2.sequenceCounter = 1;
    queue2.push("A", 10); // root
    // @ts-expect-error bypass private field
    queue2.sequenceCounter = 1;
    queue2.push("B", 10); // child

    expect(queue2.pop()).toBe("A");
  });
});
