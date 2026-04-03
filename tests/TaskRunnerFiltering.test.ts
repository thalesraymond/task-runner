import { describe, it, expect } from "vitest";
import { TaskRunner } from "../src/TaskRunner.js";
import { TaskStep } from "../src/TaskStep.js";

describe("TaskRunner Filtering Integration", () => {
  it("should execute only the tasks specified by the filter and their required dependencies", async () => {
    const runner = new TaskRunner({});
    const executedTasks: string[] = [];

    const steps: TaskStep<unknown>[] = [
      {
        name: "A",
        tags: ["setup"],
        run: async () => {
          executedTasks.push("A");
          return { status: "success" };
        },
      },
      {
        name: "B",
        dependencies: ["A"],
        tags: ["build"],
        run: async () => {
          executedTasks.push("B");
          return { status: "success" };
        },
      },
      {
        name: "C",
        dependencies: ["B"],
        tags: ["test"],
        run: async () => {
          executedTasks.push("C");
          return { status: "success" };
        },
      },
      {
        name: "D",
        tags: ["lint"],
        run: async () => {
          executedTasks.push("D");
          return { status: "success" };
        },
      },
    ];

    const results = await runner.execute(steps, {
      filter: {
        includeTags: ["test"],
        includeDependencies: true, // Needs B, which needs A
      },
    });

    // Expecting A, B, and C to have run. D is ignored.
    expect(executedTasks).toContain("A");
    expect(executedTasks).toContain("B");
    expect(executedTasks).toContain("C");
    expect(executedTasks).not.toContain("D");

    expect(results.size).toBe(3);
    expect(results.has("A")).toBe(true);
    expect(results.has("B")).toBe(true);
    expect(results.has("C")).toBe(true);
  });

  it("should not execute dependencies if includeDependencies is false", async () => {
    const runner = new TaskRunner({});
    const executedTasks: string[] = [];

    const steps: TaskStep<unknown>[] = [
      {
        name: "A",
        run: async () => {
          executedTasks.push("A");
          return { status: "success" };
        },
      },
      {
        name: "B",
        dependencies: ["A"],
        tags: ["target"],
        run: async () => {
          executedTasks.push("B");
          return { status: "success" };
        },
      },
    ];

    // If we only target B and don't include dependencies,
    // B will fail or wait indefinitely because A is never executed or added to the graph.
    // In our runner, if a dependency is missing from the provided tasks, the graph validation might throw.
    // Let's verify that a ValidationError is thrown since 'A' is missing from the filtered tasks.
    await expect(
      runner.execute(steps, {
        filter: {
          includeTags: ["target"],
          includeDependencies: false,
        },
      })
    ).rejects.toThrow();
  });

  it("should respect exclude filters even when includeDependencies is true", async () => {
      const runner = new TaskRunner({});
      const executedTasks: string[] = [];

      const steps: TaskStep<unknown>[] = [
        {
          name: "A",
          run: async () => {
            executedTasks.push("A");
            return { status: "success" };
          },
        },
        {
          name: "B",
          dependencies: ["A"],
          tags: ["target"],
          run: async () => {
            executedTasks.push("B");
            return { status: "success" };
          },
        },
      ];

      // Target B, but exclude A. A is a dependency, so validation will fail because A is not in graph.
      await expect(
        runner.execute(steps, {
          filter: {
            includeTags: ["target"],
            excludeNames: ["A"],
            includeDependencies: true,
          },
        })
      ).rejects.toThrow();
    });
});
