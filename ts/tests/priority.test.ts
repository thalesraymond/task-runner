import { describe, it, expect, beforeEach } from "vitest";
import { TaskRunner } from "../src/TaskRunner.js";
import { TaskStep } from "../src/TaskStep.js";

describe("Task Priority Scheduling", () => {
  let context: Record<string, never>;
  let runner: TaskRunner<typeof context>;
  let executionOrder: string[];

  const createTask = (
    name: string,
    priority?: number,
    dependencies?: string[]
  ): TaskStep<typeof context> => ({
    name,
    priority,
    dependencies,
    run: async () => {
      executionOrder.push(name);
      await new Promise((resolve) => setTimeout(resolve, 10));
      return { status: "success" };
    },
  });

  beforeEach(() => {
    context = {};
    runner = new TaskRunner(context);
    executionOrder = [];
  });

  it("should execute higher priority tasks first when concurrency is limited", async () => {
    const tasks = [
      createTask("low", 1),
      createTask("medium", 5),
      createTask("high", 10),
      createTask("default"),
    ];

    await runner.execute(tasks, { concurrency: 1 });

    expect(executionOrder).toEqual(["high", "medium", "low", "default"]);
  });

  it("should maintain FIFO order for tasks with equal priority", async () => {
    const tasks = [
      createTask("first", 5),
      createTask("second", 5),
      createTask("third", 5),
    ];

    await runner.execute(tasks, { concurrency: 1 });

    expect(executionOrder).toEqual(["first", "second", "third"]);
  });

  it("should treat undefined priority as 0", async () => {
    const tasks = [
      createTask("undefined-priority"),
      createTask("zero-priority", 0),
      createTask("positive", 1),
      createTask("negative", -1),
    ];

    await runner.execute(tasks, { concurrency: 1 });

    expect(executionOrder).toEqual([
      "positive",
      "undefined-priority",
      "zero-priority",
      "negative",
    ]);
  });

  it("should respect priority when tasks become ready at different times", async () => {
    const tasks = [
      createTask("root", 0),
      createTask("low-child", 1, ["root"]),
      createTask("high-child", 10, ["root"]),
    ];

    await runner.execute(tasks, { concurrency: 1 });

    expect(executionOrder).toEqual(["root", "high-child", "low-child"]);
  });

  it("should not affect execution when concurrency is unlimited", async () => {
    let tasksStarted = 0;
    let maxConcurrent = 0;

    const createConcurrencyTask = (
      name: string,
      priority?: number
    ): TaskStep<typeof context> => ({
      name,
      priority,
      run: async () => {
        tasksStarted++;
        maxConcurrent = Math.max(maxConcurrent, tasksStarted);
        await new Promise((resolve) => setTimeout(resolve, 50));
        tasksStarted--;
        return { status: "success" };
      },
    });

    const tasks = [
      createConcurrencyTask("low", 1),
      createConcurrencyTask("medium", 5),
      createConcurrencyTask("high", 10),
    ];

    await runner.execute(tasks);

    expect(maxConcurrent).toBe(3);
  });

  it("should handle mixed priority and dependency scenarios", async () => {
    const tasks = [
      createTask("A", 1),
      createTask("B", 10, ["A"]),
      createTask("C", 5),
    ];

    await runner.execute(tasks, { concurrency: 1 });

    expect(executionOrder).toEqual(["C", "A", "B"]);
  });
});
