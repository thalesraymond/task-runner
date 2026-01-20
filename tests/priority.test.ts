import { describe, it, expect } from "vitest";
import { TaskRunner } from "../src/TaskRunner.js";
import { TaskStep } from "../src/TaskStep.js";

describe("Task Priority Scheduling", () => {
  it("should execute higher priority tasks first when concurrency is limited", async () => {
    const context = {};
    const runner = new TaskRunner(context);
    const executionOrder: string[] = [];

    const createTask = (
      name: string,
      priority?: number
    ): TaskStep<typeof context> => ({
      name,
      priority,
      run: async () => {
        executionOrder.push(name);
        await new Promise((resolve) => setTimeout(resolve, 10));
        return { status: "success" };
      },
    });

    
    const tasks = [
      createTask("low", 1),
      createTask("medium", 5),
      createTask("high", 10),
      createTask("default"), // undefined priority = 0
    ];

    await runner.execute(tasks, { concurrency: 1 });

    
    expect(executionOrder).toEqual(["high", "medium", "low", "default"]);
  });

  it("should maintain FIFO order for tasks with equal priority", async () => {
    const context = {};
    const runner = new TaskRunner(context);
    const executionOrder: string[] = [];

    const createTask = (
      name: string,
      priority?: number
    ): TaskStep<typeof context> => ({
      name,
      priority,
      run: async () => {
        executionOrder.push(name);
        await new Promise((resolve) => setTimeout(resolve, 10));
        return { status: "success" };
      },
    });


    const tasks = [
      createTask("first", 5),
      createTask("second", 5),
      createTask("third", 5),
    ];

    await runner.execute(tasks, { concurrency: 1 });


    expect(executionOrder).toEqual(["first", "second", "third"]);
  });

  it("should treat undefined priority as 0", async () => {
    const context = {};
    const runner = new TaskRunner(context);
    const executionOrder: string[] = [];

    const createTask = (
      name: string,
      priority?: number
    ): TaskStep<typeof context> => ({
      name,
      priority,
      run: async () => {
        executionOrder.push(name);
        await new Promise((resolve) => setTimeout(resolve, 10));
        return { status: "success" };
      },
    });

    const tasks = [
      createTask("undefined-priority"), // undefined = 0
      createTask("zero-priority", 0),
      createTask("positive", 1),
      createTask("negative", -1),
    ];

    await runner.execute(tasks, { concurrency: 1 });

    // positive (1) > zero (0) = undefined (0) > negative (-1)
    // For equal priorities (zero and undefined), FIFO applies
    expect(executionOrder).toEqual([
      "positive",
      "undefined-priority",
      "zero-priority",
      "negative",
    ]);
  });

  it("should respect priority when tasks become ready at different times", async () => {
    const context = {};
    const runner = new TaskRunner(context);
    const executionOrder: string[] = [];

    const rootTask: TaskStep<typeof context> = {
      name: "root",
      priority: 0,
      run: async () => {
        executionOrder.push("root");
        await new Promise((resolve) => setTimeout(resolve, 10));
        return { status: "success" };
      },
    };

    const lowPriorityTask: TaskStep<typeof context> = {
      name: "low-child",
      dependencies: ["root"],
      priority: 1,
      run: async () => {
        executionOrder.push("low-child");
        await new Promise((resolve) => setTimeout(resolve, 10));
        return { status: "success" };
      },
    };

    const highPriorityTask: TaskStep<typeof context> = {
      name: "high-child",
      dependencies: ["root"],
      priority: 10,
      run: async () => {
        executionOrder.push("high-child");
        await new Promise((resolve) => setTimeout(resolve, 10));
        return { status: "success" };
      },
    };

   
    const tasks = [rootTask, lowPriorityTask, highPriorityTask];

    await runner.execute(tasks, { concurrency: 1 });

    
    expect(executionOrder).toEqual(["root", "high-child", "low-child"]);
  });

  it("should not affect execution when concurrency is unlimited", async () => {
    const context = {};
    const runner = new TaskRunner(context);

    let tasksStarted = 0;
    let maxConcurrent = 0;

    const createTask = (
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
      createTask("low", 1),
      createTask("medium", 5),
      createTask("high", 10),
    ];

    // No concurrency limit. all tasks should run in parallel
    await runner.execute(tasks);

    expect(maxConcurrent).toBe(3);
  });

  it("should handle mixed priority and dependency scenarios", async () => {
    const context = {};
    const runner = new TaskRunner(context);
    const executionOrder: string[] = [];

    const tasks: TaskStep<typeof context>[] = [
      {
        name: "A",
        priority: 1,
        run: async () => {
          executionOrder.push("A");
          await new Promise((resolve) => setTimeout(resolve, 10));
          return { status: "success" };
        },
      },
      {
        name: "B",
        dependencies: ["A"],
        priority: 10,
        run: async () => {
          executionOrder.push("B");
          await new Promise((resolve) => setTimeout(resolve, 10));
          return { status: "success" };
        },
      },
      {
        name: "C",
        priority: 5,
        run: async () => {
          executionOrder.push("C");
          await new Promise((resolve) => setTimeout(resolve, 10));
          return { status: "success" };
        },
      },
    ];

    await runner.execute(tasks, { concurrency: 1 });

    // C (5) > A (1), then B becomes ready after A
    expect(executionOrder).toEqual(["C", "A", "B"]);
  });
});
