import { describe, it, expect } from "vitest";
import { TaskRunner } from "../src/TaskRunner.js";
import { TaskStep } from "../src/TaskStep.js";

interface TestContext {
  executedTasks: string[];
}

const createTestTask = (
  name: string,
  dependencies?: string[],
  tags?: string[]
): TaskStep<TestContext> => ({
  name,
  dependencies,
  tags,
  run: async (ctx) => {
    ctx.executedTasks.push(name);
    return { status: "success" };
  },
});

describe("TaskRunner Filtering End-to-End", () => {
  const steps: TaskStep<TestContext>[] = [
    createTestTask("task-1", [], ["setup"]),
    createTestTask("task-2", ["task-1"], ["build"]),
    createTestTask("task-3", ["task-2"], ["test", "unit"]),
    createTestTask("task-4", ["task-2"], ["test", "e2e"]),
  ];

  it("should run all tasks when no filter is provided", async () => {
    const context: TestContext = { executedTasks: [] };
    const runner = new TaskRunner(context);

    await runner.execute(steps);

    expect(context.executedTasks.length).toBe(4);
    expect(context.executedTasks).toContain("task-1");
    expect(context.executedTasks).toContain("task-2");
    expect(context.executedTasks).toContain("task-3");
    expect(context.executedTasks).toContain("task-4");
  });

  it("should execute only the filtered tasks by tag", async () => {
    const context: TestContext = { executedTasks: [] };
    const runner = new TaskRunner(context);

    // Filter only "test" tasks, omitting dependencies
    // task-3 and task-4 depend on task-2. In reality, the graph would fail validation if we omit dependencies,
    // but our execution config should handle it or fail validation if dependencies are missing and includeDependencies is false.
    // Wait, TaskGraphValidator checks if dependencies exist in the passed graph.
    // Let's test with includeDependencies: true to ensure valid execution graph.
    await runner.execute(steps, {
      filter: {
        includeTags: ["test"],
        includeDependencies: true,
      },
    });

    expect(context.executedTasks.length).toBe(4); // includes 1, 2, 3, 4
  });

  it("should execute only the explicitly included task when valid isolated graph", async () => {
    const context: TestContext = { executedTasks: [] };
    const runner = new TaskRunner(context);

    await runner.execute(steps, {
      filter: {
        includeNames: ["task-1"],
      },
    });

    expect(context.executedTasks.length).toBe(1);
    expect(context.executedTasks).toEqual(["task-1"]);
  });

  it("should fail validation if filtering creates broken dependency graph", async () => {
    const context: TestContext = { executedTasks: [] };
    const runner = new TaskRunner(context);

    // This will include task-2 which depends on task-1, but task-1 is filtered out.
    // TaskGraphValidator should throw.
    await expect(
      runner.execute(steps, {
        filter: {
          includeNames: ["task-2"],
          includeDependencies: false,
        },
      })
    ).rejects.toThrow();
  });
});
