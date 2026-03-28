import { describe, it, expect } from "vitest";
import { TaskRunnerBuilder } from "../src/TaskRunnerBuilder.js";

describe("TaskRunnerBuilder Benchmark", () => {
  it("build() performance", () => {
    const context = {};
    const iterations = 100000;

    // Warmup
    for (let i = 0; i < 100; i++) {
      const builder = new TaskRunnerBuilder(context);
      builder.on("workflowStart", () => {});
      builder.on("taskStart", () => {});
      builder.on("taskEnd", () => {});
      builder.on("workflowEnd", () => {});
      builder.build();
    }

    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      const builder = new TaskRunnerBuilder(context);
      builder.on("workflowStart", () => {});
      builder.on("taskStart", () => {});
      builder.on("taskEnd", () => {});
      builder.on("workflowEnd", () => {});
      builder.build();
    }
    const end = performance.now();
    const duration = end - start;

    console.log(`TaskRunnerBuilder.build() x ${iterations} iterations took ${duration.toFixed(2)}ms`);

    // Loose assertion to ensure it runs
    expect(duration).toBeGreaterThan(0);
  });
});
