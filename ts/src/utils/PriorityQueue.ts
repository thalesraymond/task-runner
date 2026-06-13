export class PriorityQueue<T> {
  private heap: { item: T; priority: number; sequenceId: number }[] = [];
  private sequenceCounter = 0;

  push(item: T, priority: number): void {
    const node = { item, priority, sequenceId: this.sequenceCounter++ };
    this.heap.push(node);
    this.bubbleUp();
  }

  pop(): T | undefined {
    if (this.heap.length === 0) return undefined;
    if (this.heap.length === 1) return this.heap.pop()!.item;

    const top = this.heap[0];
    this.heap[0] = this.heap.pop()!;
    this.sinkDown();
    return top.item;
  }

  peek(): T | undefined {
    return this.heap[0]?.item;
  }

  size(): number {
    return this.heap.length;
  }

  isEmpty(): boolean {
    return this.heap.length === 0;
  }

  clear(): void {
    this.heap = [];
    this.sequenceCounter = 0;
  }

  private bubbleUp(): void {
    let index = this.heap.length - 1;
    const element = this.heap[index];

    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      const parent = this.heap[parentIndex];

      if (this.compare(element, parent) <= 0) break;

      this.heap[index] = parent;
      this.heap[parentIndex] = element;
      index = parentIndex;
    }
  }

  private sinkDown(): void {
    let index = 0;
    const length = this.heap.length;
    const element = this.heap[0];

    while (true) {
      const leftChildIndex = 2 * index + 1;
      const rightChildIndex = 2 * index + 2;
      let swapIndex: number | null = null;

      if (leftChildIndex < length) {
        if (this.compare(this.heap[leftChildIndex], element) > 0) {
          swapIndex = leftChildIndex;
        }
      }

      if (rightChildIndex < length) {
        const rightChild = this.heap[rightChildIndex];
        const leftChild = this.heap[leftChildIndex];

        if (
          (swapIndex === null && this.compare(rightChild, element) > 0) ||
          (swapIndex !== null && this.compare(rightChild, leftChild) > 0)
        ) {
          swapIndex = rightChildIndex;
        }
      }

      if (swapIndex === null) break;

      this.heap[index] = this.heap[swapIndex];
      this.heap[swapIndex] = element;
      index = swapIndex;
    }
  }

  // Returns positive if a > b (a should come before b)
  private compare(
    a: { priority: number; sequenceId: number },
    b: { priority: number; sequenceId: number }
  ): number {
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    // Lower sequenceId means earlier insertion, so it has higher priority
    return b.sequenceId - a.sequenceId;
  }
}
