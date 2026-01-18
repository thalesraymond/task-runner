
import { describe, it, expect, vi } from "vitest";
import { TaskRunner } from "../src/TaskRunner.js";
import { TaskStep } from "../src/TaskStep.js";

interface TestContext {
  results: string[];
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("TaskRunner Concurrency Control", () => {
  it("should execute tasks sequentially when concurrency is 1", async () => {
    const context: TestContext = { results: [] };
    const runner = new TaskRunner<TestContext>(context);

    const steps: TaskStep<TestContext>[] = [
      {
        name: "task1",
        run: async (ctx) => {
          ctx.results.push("start1");
          await sleep(20);
          ctx.results.push("end1");
          return { status: "success" };
        },
      },
      {
        name: "task2",
        run: async (ctx) => {
          ctx.results.push("start2");
          await sleep(20);
          ctx.results.push("end2");
          return { status: "success" };
        },
      },
      {
        name: "task3",
        run: async (ctx) => {
          ctx.results.push("start3");
          await sleep(20);
          ctx.results.push("end3");
          return { status: "success" };
        },
      },
    ];

    await runner.execute(steps, { concurrency: 1 });

    // With concurrency 1, tasks must start and finish before the next one starts
    // Expected order: start1, end1, start2, end2, start3, end3
    expect(context.results).toEqual([
      "start1",
      "end1",
      "start2",
      "end2",
      "start3",
      "end3",
    ]);
  });

  it("should execute tasks in parallel up to the limit (concurrency = 2)", async () => {
    const context: TestContext = { results: [] };
    const runner = new TaskRunner<TestContext>(context);

    // Use timestamps or flags to verify overlap
    const activeTasks = new Set<string>();
    let maxConcurrent = 0;

    const createStep = (name: string): TaskStep<TestContext> => ({
      name,
      run: async () => {
        activeTasks.add(name);
        maxConcurrent = Math.max(maxConcurrent, activeTasks.size);
        await sleep(50);
        activeTasks.delete(name);
        return { status: "success" };
      },
    });

    const steps = [
      createStep("task1"),
      createStep("task2"),
      createStep("task3"),
      createStep("task4"),
    ];

    await runner.execute(steps, { concurrency: 2 });

    expect(maxConcurrent).toBeLessThanOrEqual(2);
    // Ideally it should reach 2
    expect(maxConcurrent).toBe(2);
  });

  it("should queue tasks when concurrency limit is reached", async () => {
    const context: TestContext = { results: [] };
    const runner = new TaskRunner<TestContext>(context);

    // We want to ensure task3 doesn't start until one of task1 or task2 finishes
    const activeTasks = new Set<string>();
    let maxConcurrent = 0;

    const createStep = (name: string, duration: number): TaskStep<TestContext> => ({
      name,
      run: async (ctx) => {
        activeTasks.add(name);
        maxConcurrent = Math.max(maxConcurrent, activeTasks.size);
        ctx.results.push(`start-${name}`);
        await sleep(duration);
        ctx.results.push(`end-${name}`);
        activeTasks.delete(name);
        return { status: "success" };
      },
    });

    const steps = [
      createStep("task1", 50),
      createStep("task2", 50),
      createStep("task3", 10), // Short task, but should be blocked
    ];

    await runner.execute(steps, { concurrency: 2 });

    expect(maxConcurrent).toBe(2);

    const start3Index = context.results.indexOf("start-task3");
    const end1Index = context.results.indexOf("end-task1");
    const end2Index = context.results.indexOf("end-task2");

    // Task 3 should start after either task 1 or task 2 finishes
    // So start3Index should be > (min of end1Index, end2Index)
    const firstFinishIndex = Math.min(end1Index, end2Index);
    expect(start3Index).toBeGreaterThan(firstFinishIndex);
  });

  it("should use unlimited concurrency when limit is undefined", async () => {
    const context: TestContext = { results: [] };
    const runner = new TaskRunner<TestContext>(context);

    const activeTasks = new Set<string>();
    let maxConcurrent = 0;

    const createStep = (name: string): TaskStep<TestContext> => ({
      name,
      run: async () => {
        activeTasks.add(name);
        maxConcurrent = Math.max(maxConcurrent, activeTasks.size);
        await sleep(30);
        activeTasks.delete(name);
        return { status: "success" };
      },
    });

    const steps = [
      createStep("task1"),
      createStep("task2"),
      createStep("task3"),
    ];

    await runner.execute(steps); // No config or empty config

    // Should run all 3 at once
    expect(maxConcurrent).toBe(3);
  });

  it("should execute each task exactly once, even when queued", async () => {
    const context: TestContext = { results: [] };
    const runner = new TaskRunner<TestContext>(context);

    // Track execution count for each task
    const executionCounts = new Map<string, number>();

    const createStep = (name: string): TaskStep<TestContext> => ({
      name,
      run: async () => {
        executionCounts.set(name, (executionCounts.get(name) || 0) + 1);
        await sleep(10); // Simulate work
        return { status: "success" };
      },
    });

    // 4 tasks, concurrency 1. This forces queueing and repeated processLoop calls.
    const steps = [
      createStep("task1"),
      createStep("task2"),
      createStep("task3"),
      createStep("task4"),
    ];

    await runner.execute(steps, { concurrency: 1 });

    expect(executionCounts.get("task1")).toBe(1);
    expect(executionCounts.get("task2")).toBe(1);
    expect(executionCounts.get("task3")).toBe(1);
    expect(executionCounts.get("task4")).toBe(1);
  });
});
