import { describe, it, expect } from "vitest";
import { TaskRunner } from "../src/TaskRunner.js";
import { TaskStep } from "../src/TaskStep.js";

describe("TaskRunner Filtering", () => {
  it("should execute only filtered tasks and their explicitly resolved dependencies", async () => {
    const executedTasks: string[] = [];
    const context = {};

    const steps: TaskStep<unknown>[] = [
      { name: "lint", tags: ["quick"], run: async () => { executedTasks.push("lint"); return { status: "success" }; } },
      { name: "build", dependencies: ["lint"], run: async () => { executedTasks.push("build"); return { status: "success" }; } },
      { name: "test", tags: ["ci"], dependencies: ["build"], run: async () => { executedTasks.push("test"); return { status: "success" }; } },
      { name: "deploy", tags: ["cd"], dependencies: ["test"], run: async () => { executedTasks.push("deploy"); return { status: "success" }; } },
    ];

    const runner = new TaskRunner(context);

    await runner.execute(steps, {
      filter: {
        includeTags: ["ci"],
        includeDependencies: true,
      }
    });

    expect(executedTasks).toEqual(["lint", "build", "test"]);
  });

  it("should not execute dependencies if includeDependencies is false/omitted", async () => {
    const executedTasks: string[] = [];
    const context = {};

    const steps: TaskStep<unknown>[] = [
      { name: "independent", tags: ["ci"], run: async () => { executedTasks.push("independent"); return { status: "success" }; } },
      { name: "dependent", tags: ["other"], dependencies: ["independent"], run: async () => { executedTasks.push("dependent"); return { status: "success" }; } },
    ];

    const runner = new TaskRunner(context);

    // This should fail validation if "dependent" is included but "independent" is not
    // Wait, the filter removes 'dependent' entirely. The graph will just have 'independent'.
    await runner.execute(steps, {
      filter: {
        includeTags: ["ci"],
      }
    });

    expect(executedTasks).toEqual(["independent"]);
  });

  it("should fail validation if a filtered-in task has missing dependencies (and includeDependencies=false)", async () => {
    const context = {};
    const steps: TaskStep<unknown>[] = [
      { name: "independent", tags: ["other"], run: async () => { return { status: "success" }; } },
      { name: "dependent", tags: ["ci"], dependencies: ["independent"], run: async () => { return { status: "success" }; } },
    ];

    const runner = new TaskRunner(context);

    // "dependent" will be included, but its dependency "independent" will not be.
    // TaskGraphValidator should throw.
    await expect(runner.execute(steps, {
      filter: {
        includeTags: ["ci"],
      }
    })).rejects.toThrow();
  });
});
