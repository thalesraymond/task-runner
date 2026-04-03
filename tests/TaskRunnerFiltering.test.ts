import { describe, it, expect } from "vitest";
import { TaskRunner } from "../src/TaskRunner.js";
import { TaskStep } from "../src/TaskStep.js";

describe("TaskRunner Filtering Integration", () => {
  it("should execute only the filtered subset of tasks", async () => {
    const executedTasks: string[] = [];
    const context = {};

    const createTask = (name: string, tags?: string[], dependencies?: string[]): TaskStep<unknown> => ({
      name,
      tags,
      dependencies,
      run: async () => {
        executedTasks.push(name);
        return { status: "success" };
      },
    });

    const tasks: TaskStep<unknown>[] = [
      createTask("taskA", ["backend"]),
      createTask("taskB", ["backend"], ["taskA"]),
      createTask("taskC", ["frontend"]),
      createTask("taskD", ["frontend"], ["taskC"]),
      createTask("taskE", [], ["taskB", "taskD"]),
    ];

    const runner = new TaskRunner(context);

    // Run only backend tasks
    await runner.execute(tasks, { filter: { includeTags: ["backend"] } });

    // Should only run taskA and taskB
    expect(executedTasks).toHaveLength(2);
    expect(executedTasks).toContain("taskA");
    expect(executedTasks).toContain("taskB");
  });

  it("should fail validation if a selected task depends on an unselected task, without includeDependencies", async () => {
    const executedTasks: string[] = [];
    const context = {};

    const createTask = (name: string, dependencies?: string[]): TaskStep<unknown> => ({
      name,
      dependencies,
      run: async () => {
        executedTasks.push(name);
        return { status: "success" };
      },
    });

    const tasks: TaskStep<unknown>[] = [
      createTask("taskA"),
      createTask("taskB", ["taskA"]),
    ];

    const runner = new TaskRunner(context);

    // Try to run taskB without its dependency taskA, and without includeDependencies: true
    await expect(runner.execute(tasks, { filter: { includeNames: ["taskB"], includeDependencies: false } }))
      .rejects.toThrow(); // Should throw a validation error because taskA is missing from the graph
  });

  it("should execute correctly if dependencies are included automatically", async () => {
    const executedTasks: string[] = [];
    const context = {};

    const createTask = (name: string, dependencies?: string[]): TaskStep<unknown> => ({
      name,
      dependencies,
      run: async () => {
        executedTasks.push(name);
        return { status: "success" };
      },
    });

    const tasks: TaskStep<unknown>[] = [
      createTask("taskA"),
      createTask("taskB", ["taskA"]),
    ];

    const runner = new TaskRunner(context);

    // Try to run taskB, with includeDependencies: true
    await runner.execute(tasks, { filter: { includeNames: ["taskB"], includeDependencies: true } });

    expect(executedTasks).toHaveLength(2);
    expect(executedTasks).toContain("taskA");
    expect(executedTasks).toContain("taskB");
  });
});
