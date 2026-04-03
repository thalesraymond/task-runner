import { describe, it, expect } from "vitest";
import { TaskRunner } from "../src/TaskRunner.js";
import { TaskStep } from "../src/TaskStep.js";

interface TestContext {
  executed: string[];
}

const createMockTask = (name: string, tags?: string[], dependencies?: string[]): TaskStep<TestContext> => ({
  name,
  tags,
  dependencies,
  run: async (ctx) => {
    ctx.executed.push(name);
    return { status: "success" };
  },
});

describe("TaskRunner Filtering Integration", () => {
  const getSteps = (): TaskStep<TestContext>[] => [
    createMockTask("init", ["setup"]),
    createMockTask("build-frontend", ["frontend", "build"], ["init"]),
    createMockTask("build-backend", ["backend", "build"], ["init"]),
    createMockTask("test-frontend", ["frontend", "test"], ["build-frontend"]),
    createMockTask("test-backend", ["backend", "test"], ["build-backend"]),
    createMockTask("deploy", ["deploy"], ["test-frontend", "test-backend"]),
  ];

  it("should execute only explicitly included tasks when includeDependencies is false (if they have no missing deps)", async () => {
    // For this specific test, test a standalone task or root task to avoid validation errors.
    const standaloneContext: TestContext = { executed: [] };
    const standaloneRunner = new TaskRunner(standaloneContext);

    await standaloneRunner.execute(getSteps(), {
      filter: { includeNames: ["init"] }
    });

    expect(standaloneContext.executed).toEqual(["init"]);
  });

  it("should run tasks and their dependencies when includeDependencies is true", async () => {
    const context: TestContext = { executed: [] };
    const runner = new TaskRunner(context);

    await runner.execute(getSteps(), {
      filter: {
        includeTags: ["backend"],
        includeDependencies: true
      }
    });

    // Should include 'build-backend', 'test-backend', and their dep 'init'
    expect(context.executed).toContain("init");
    expect(context.executed).toContain("build-backend");
    expect(context.executed).toContain("test-backend");
    expect(context.executed).not.toContain("build-frontend");
    expect(context.executed).not.toContain("test-frontend");
    expect(context.executed).not.toContain("deploy");
  });

  it("should not execute excluded tasks, even if they match inclusion criteria", async () => {
    const context: TestContext = { executed: [] };
    const runner = new TaskRunner(context);

    await runner.execute(getSteps(), {
      filter: {
        includeTags: ["build"],
        excludeNames: ["build-backend"],
        includeDependencies: true
      }
    });

    // 'build' tag matches build-frontend and build-backend.
    // excludeNames removes build-backend.
    // includeDependencies brings in 'init' for build-frontend.
    expect(context.executed).toContain("init");
    expect(context.executed).toContain("build-frontend");
    expect(context.executed).not.toContain("build-backend");
  });
});
