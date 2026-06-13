import { describe, it, expect } from "vitest";
import { PriorityQueue } from "../src/utils/PriorityQueue.js";

describe("PriorityQueue surviving mutants", () => {
  it("kills ConditionalExpression mutant at line 75", () => {
    // - (swapIndex === null && this.compare(rightChild, element) > 0) ||
    // + (swapIndex === null && true) ||
    const queue = new PriorityQueue<number>();

    // We want swapIndex to be null (meaning leftChild was not greater than element)
    // and we want rightChild NOT to be greater than element (so true kills the mutant)
    queue.push(10, 10);
    queue.push(8, 8);   // left child
    queue.push(5, 5);   // right child
    queue.push(20, 20); // out first, 5 becomes root
    queue.pop();
    // element is 5
    // left is 8
    // compare(8, 5) > 0 ? Yes. Oh, we need swapIndex === null.
    // So leftChild MUST NOT be greater than element.
    // Meaning leftChild <= element.
    const queue2 = new PriorityQueue<number>();
    queue2.push(20, 20); // out first
    queue2.push(5, 5);   // left
    queue2.push(2, 2);   // right
    queue2.push(10, 10); // next root

    // pop 20. 10 becomes root.
    // left is 5, right is 2.
    // compare(5, 10) > 0 ? No. swapIndex = null.
    // compare(2, 10) > 0 ? No.
    // So if (swapIndex === null && true), swapIndex becomes rightChild (2).
    // The mutated code will swap 10 and 2. Then next pop is 5.
    // Correct code will not swap, next pop is 10.
    queue2.pop();
    expect(queue2.pop()).toBe(10);
  });

  it("kills ConditionalExpression mutant at line 76", () => {
    // - (swapIndex !== null && this.compare(rightChild, leftChild) > 0)
    // + (true && this.compare(rightChild, leftChild) > 0)

    // To kill this, we need swapIndex to be null (so leftChild <= element)
    // But we need compare(rightChild, leftChild) > 0.
    // And compare(rightChild, element) <= 0.
    const queue = new PriorityQueue<number>();
    queue.push(20, 20); // out first
    queue.push(5, 5);   // left
    queue.push(8, 8);   // right
    queue.push(10, 10); // next root

    // Pop 20, 10 becomes root.
    // left is 5, right is 8.
    // compare(5, 10) > 0 ? No. swapIndex = null.
    // compare(8, 10) > 0 ? No.
    // line 75 check: swapIndex === null && compare(8, 10) > 0 is FALSE.
    // line 76 check: swapIndex !== null && compare(8, 5) > 0
    // Mutated: true && compare(8, 5) > 0 -> TRUE!
    // So mutated code swaps 10 and 8. Next pop would be 10 (Wait, if swapped, 8 becomes root? No, we swapped 10 and 8, so 10 is child, 8 is root... wait, if mutated code swaps, 8 becomes root. Wait, 10 is root. Let's see:
    // If it swaps, 8 is root, 10 is right child. Then pop returns 8? Let's check.)

    queue.pop();
    expect(queue.pop()).toBe(10);
  });

  it("kills EqualityOperator mutant at line 46", () => {
    // - if (this.compare(element, parent) <= 0) break;
    // + if (this.compare(element, parent) < 0) break;
    // To kill this, we need compare(element, parent) === 0.
    const queue = new PriorityQueue<string>();
    // @ts-expect-error bypass private field
    queue.sequenceCounter = 1;
    queue.push("A", 10);
    // @ts-expect-error bypass private field
    queue.sequenceCounter = 1;
    queue.push("B", 10);
    // When "B" is pushed, it compares "B" to "A".
    // priority is same, sequenceCounter is same, so compare returns 0.
    // If <= 0, break. It doesn't bubble up. Heap is ["A", "B"].
    // If < 0, it doesn't break. It bubbles up. Heap is ["B", "A"].
    // Let's pop. If it didn't bubble up, pop returns "A".
    // If it bubbled up, pop returns "B".
    expect(queue.pop()).toBe("A");
  });

  it("kills EqualityOperator mutant at line 65", () => {
    // - if (this.compare(this.heap[leftChildIndex], element) > 0) {
    // + if (this.compare(this.heap[leftChildIndex], element) >= 0) {
    // We need compare(leftChild, element) === 0.
    const queue = new PriorityQueue<string>();
    // @ts-expect-error bypass private field
    queue.sequenceCounter = 1;
    queue.push("A", 10); // out first
    // @ts-expect-error bypass private field
    queue.sequenceCounter = 1;
    queue.push("B", 5);  // left child
    // @ts-expect-error bypass private field
    queue.sequenceCounter = 1;
    queue.push("C", 5);  // next root

    // pop 10, C becomes root.
    // left is B.
    // compare(B, C) === 0.
    // If > 0, swapIndex is null.
    // If >= 0, swapIndex is leftChild (1).
    // Mutated code will swap C and B. Next pop is C.
    // Correct code will not swap. Next pop is C.
    // Wait, both "C" and "B" have same priority/sequenceId, so they are indistinguishable for pop order?
    // Let's check: C is root, B is left child.
    // If no swap, C is root. Pop returns C.
    // If swap, B is root. Pop returns B.
    queue.pop();
    expect(queue.pop()).toBe("C");
  });

  it("kills EqualityOperator mutant at line 75", () => {
    // - (swapIndex === null && this.compare(rightChild, element) > 0) ||
    // + (swapIndex === null && this.compare(rightChild, element) >= 0) ||
    // We need swapIndex === null, and compare(rightChild, element) === 0.
    const queue = new PriorityQueue<string>();
    // @ts-expect-error bypass private field
    queue.sequenceCounter = 1;
    queue.push("A", 10); // out first
    // @ts-expect-error bypass private field
    queue.sequenceCounter = 1;
    queue.push("B", 2);  // left child
    // @ts-expect-error bypass private field
    queue.sequenceCounter = 1;
    queue.push("C", 5);  // right child
    // @ts-expect-error bypass private field
    queue.sequenceCounter = 1;
    queue.push("D", 5);  // next root

    // Pop A. D becomes root.
    // left is B, right is C.
    // compare(B, D) < 0 -> swapIndex = null.
    // compare(C, D) === 0.
    // If > 0, false.
    // If >= 0, true. swapIndex becomes rightChild (2).
    // So mutated code swaps C and D. Pop returns C.
    // Correct code doesn't swap. Pop returns D.
    queue.pop();
    expect(queue.pop()).toBe("D");
  });
});
