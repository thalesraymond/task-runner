import { describe, it, expect } from "vitest";
import { TaskRunner } from "../src/TaskRunner.js";
import { TaskStep } from "../src/TaskStep.js";

describe("TaskRunner Filtering Integration", () => {
  it("should execute only the filtered tasks and respect dependencies", async () => {
    const runner = new TaskRunner({});
    const executed: string[] = [];

    const createStep = (name: string, tags: string[] = [], dependencies: string[] = []): TaskStep<unknown> => ({
      name,
      tags,
      dependencies,
      run: async () => {
        executed.push(name);
        return { status: "success" };
      },
    });

    const steps = [
      createStep("task1", ["groupA"]),
      createStep("task2", ["groupB"], ["task1"]),
      createStep("task3", ["groupA"], ["task2"]),
      createStep("task4", ["groupC"]),
    ];

    // Execution with filter: include groupC and groupA
    const result = await runner.execute(steps, {
      filter: {
        includeTags: ["groupC"],
      },
    });

    expect(result.size).toBe(1);
    expect(executed).toEqual(["task4"]);
  });

  it("should fail validation if an included task's dependency is missing because of filter and includeDependencies is false", async () => {
    const runner = new TaskRunner({});
    const executed: string[] = [];

    const createStep = (name: string, tags: string[] = [], dependencies: string[] = []): TaskStep<unknown> => ({
      name,
      tags,
      dependencies,
      run: async () => {
        executed.push(name);
        return { status: "success" };
      },
    });

    const steps = [
      createStep("task1", ["groupA"]),
      createStep("task2", ["groupB"], ["task1"]),
    ];

    // Execute with filter that includes task2 but NOT task1, and includeDependencies is false
    // Since task1 is required by task2 but is missing from the filtered list, TaskGraphValidator should throw an error.
    await expect(
      runner.execute(steps, {
        filter: {
          includeNames: ["task2"],
          includeDependencies: false,
        },
      })
    ).rejects.toThrow(); // The validation error for missing dependency
  });

  it("should successfully execute if includeDependencies is true", async () => {
    const runner = new TaskRunner({});
    const executed: string[] = [];

    const createStep = (name: string, tags: string[] = [], dependencies: string[] = []): TaskStep<unknown> => ({
      name,
      tags,
      dependencies,
      run: async () => {
        executed.push(name);
        return { status: "success" };
      },
    });

    const steps = [
      createStep("task1", ["groupA"]),
      createStep("task2", ["groupB"], ["task1"]),
    ];

    const result = await runner.execute(steps, {
      filter: {
        includeNames: ["task2"],
        includeDependencies: true,
      },
    });

    expect(result.size).toBe(2);
    // Because of dependency, task1 must execute before task2
    expect(executed).toEqual(["task1", "task2"]);
  });
});
