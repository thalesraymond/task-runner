
import { describe, it, expect } from "vitest";
import { TaskRunner } from "../src/TaskRunner.js";
import { TaskStep } from "../src/TaskStep.js";

describe("Concurrency Control", () => {
  it("should limit concurrency to 1", async () => {
    const context = {};
    const runner = new TaskRunner(context);

    let activeTasks = 0;
    let maxActiveTasks = 0;

    const createSlowTask = (name: string): TaskStep<typeof context> => ({
      name,
      run: async () => {
        activeTasks++;
        maxActiveTasks = Math.max(maxActiveTasks, activeTasks);
        await new Promise((resolve) => setTimeout(resolve, 50));
        activeTasks--;
        return { status: "success" };
      },
    });

    const tasks = [
      createSlowTask("task1"),
      createSlowTask("task2"),
      createSlowTask("task3"),
    ];

    await runner.execute(tasks, { concurrency: 1 });

    expect(maxActiveTasks).toBe(1);
  });

  it("should limit concurrency to 2", async () => {
    const context = {};
    const runner = new TaskRunner(context);

    let activeTasks = 0;
    let maxActiveTasks = 0;

    const createSlowTask = (name: string): TaskStep<typeof context> => ({
      name,
      run: async () => {
        activeTasks++;
        maxActiveTasks = Math.max(maxActiveTasks, activeTasks);
        await new Promise((resolve) => setTimeout(resolve, 50));
        activeTasks--;
        return { status: "success" };
      },
    });

    const tasks = [
      createSlowTask("task1"),
      createSlowTask("task2"),
      createSlowTask("task3"),
      createSlowTask("task4"),
    ];

    await runner.execute(tasks, { concurrency: 2 });

    expect(maxActiveTasks).toBeLessThanOrEqual(2);
    // It should be 2 at some point ideally, but strictly it must not exceed 2.
    // Given the tasks are slow enough, it should hit 2.
    expect(maxActiveTasks).toBe(2);
  });

  it("should handle unlimited concurrency (default)", async () => {
    const context = {};
    const runner = new TaskRunner(context);

    let activeTasks = 0;
    let maxActiveTasks = 0;

    const createSlowTask = (name: string): TaskStep<typeof context> => ({
      name,
      run: async () => {
        activeTasks++;
        maxActiveTasks = Math.max(maxActiveTasks, activeTasks);
        await new Promise((resolve) => setTimeout(resolve, 50));
        activeTasks--;
        return { status: "success" };
      },
    });

    const tasks = [
      createSlowTask("task1"),
      createSlowTask("task2"),
      createSlowTask("task3"),
    ];

    await runner.execute(tasks);

    expect(maxActiveTasks).toBe(3);
  });
});
