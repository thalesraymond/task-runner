import { describe, it, expect } from "vitest";
import { performance } from "perf_hooks";

describe("Array indexOf - Benchmark", () => {
  it("should benchmark indexOf on a large array", () => {
    const depth = 500000;
    const path: string[] = [];

    for (let i = 0; i < depth; i++) {
      path.push(`task-${i}`);
    }

    const start = performance.now();
    const cycleStart = path[0];
    const cycleStartIndex = path.indexOf(cycleStart);
    const end = performance.now();

    expect(cycleStartIndex).toBe(0);
    console.log(`indexOf took ${end - start}ms`);
  });
});
