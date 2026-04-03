import { describe, it, expect } from "vitest";
import { filterTasks } from "../../src/utils/TaskFilter.js";
import { TaskStep } from "../../src/TaskStep.js";

interface TestContext {
  dummy?: boolean;
}

const createMockTask = (
  name: string,
  dependencies?: string[],
  tags?: string[]
): TaskStep<TestContext> => ({
  name,
  dependencies,
  tags,
  run: async () => ({ status: "success" as const }),
});

describe("TaskFilter", () => {
  const steps: TaskStep<TestContext>[] = [
    createMockTask("task-a", [], ["core", "setup"]),
    createMockTask("task-b", ["task-a"], ["build", "frontend"]),
    createMockTask("task-c", ["task-b"], ["test", "frontend"]),
    createMockTask("task-d", ["task-a"], ["build", "backend"]),
    createMockTask("task-e", ["task-d"], ["test", "backend"]),
    createMockTask("task-f", ["task-c", "task-e"], ["deploy"]),
  ];

  it("should return all tasks when no filter is provided", () => {
    const result = filterTasks(steps, {});
    expect(result.length).toBe(6);
    expect(result).toEqual(steps);
  });

  describe("Filtering by name", () => {
    it("should include only specified names", () => {
      const result = filterTasks(steps, { includeNames: ["task-a", "task-c"] });
      expect(result.length).toBe(2);
      expect(result.map((r) => r.name)).toEqual(["task-a", "task-c"]);
    });

    it("should exclude specified names", () => {
      const result = filterTasks(steps, { excludeNames: ["task-f", "task-e"] });
      expect(result.length).toBe(4);
      expect(result.map((r) => r.name)).toEqual([
        "task-a",
        "task-b",
        "task-c",
        "task-d",
      ]);
    });
  });

  describe("Filtering by tag", () => {
    it("should include only specified tags", () => {
      const result = filterTasks(steps, { includeTags: ["frontend"] });
      expect(result.length).toBe(2);
      expect(result.map((r) => r.name)).toEqual(["task-b", "task-c"]);
    });

    it("should include matching multiple tags (OR logic)", () => {
      const result = filterTasks(steps, { includeTags: ["test", "setup"] });
      expect(result.length).toBe(3);
      expect(result.map((r) => r.name)).toEqual(["task-a", "task-c", "task-e"]);
    });

    it("should exclude specified tags", () => {
      const result = filterTasks(steps, { excludeTags: ["backend", "deploy"] });
      expect(result.length).toBe(3);
      expect(result.map((r) => r.name)).toEqual(["task-a", "task-b", "task-c"]);
    });
  });

  describe("Combined filtering", () => {
    it("should fallback to true if no valid inclusion values are provided", () => {
      const result = filterTasks(steps, {
        includeTags: [],
        includeNames: [],
      });
      expect(result.length).toBe(6);
    });

    it("should include by tag OR name", () => {
      const result = filterTasks(steps, {
        includeTags: ["setup"],
        includeNames: ["task-f"],
      });
      expect(result.length).toBe(2);
      expect(result.map((r) => r.name)).toEqual(["task-a", "task-f"]);
    });

    it("should exclude taking precedence over include", () => {
      const result = filterTasks(steps, {
        includeTags: ["frontend", "backend"],
        excludeTags: ["test"],
        excludeNames: ["task-b"],
      });
      // Should include build-frontend and build-backend (task-b, task-d)
      // Exclude test tags (task-c, task-e)
      // Exclude name task-b
      // Result: only task-d
      expect(result.length).toBe(1);
      expect(result.map((r) => r.name)).toEqual(["task-d"]);
    });
  });

  describe("Dependency Resolution", () => {
    it("should handle current without dependencies array in queue", () => {
      const stepNoDeps = createMockTask("task-no-deps");
      // Add a task without dependencies to test queue processing logic branch where current.dependencies is falsy.
      const result = filterTasks([stepNoDeps], {
        includeNames: ["task-no-deps"],
        includeDependencies: true,
      });
      expect(result.length).toBe(1);
    });

    it("should safely ignore missing dependencies in the given steps array", () => {
      const incompleteSteps: TaskStep<TestContext>[] = [
        createMockTask("task-a", []),
        createMockTask("task-b", ["task-missing"]),
      ];
      const result = filterTasks(incompleteSteps, {
        includeNames: ["task-b"],
        includeDependencies: true,
      });
      // Should gracefully skip missing dependencies and just return the task
      expect(result.length).toBe(1);
      expect(result[0].name).toBe("task-b");
    });

    it("should include dependencies recursively when flag is true", () => {
      const result = filterTasks(steps, {
        includeNames: ["task-f"],
        includeDependencies: true,
      });
      // task-f depends on task-c and task-e
      // task-c depends on task-b
      // task-b depends on task-a
      // task-e depends on task-d
      // task-d depends on task-a
      // Everything should be included
      expect(result.length).toBe(6);
    });

    it("should include missing dependencies for tags", () => {
      const result = filterTasks(steps, {
        includeTags: ["test"],
        includeDependencies: true,
      });
      // Test tasks: task-c, task-e
      // task-c needs task-b, task-a
      // task-e needs task-d, task-a
      // Should include a, b, c, d, e (no f)
      expect(result.length).toBe(5);
      expect(result.map((r) => r.name)).toEqual([
        "task-a",
        "task-b",
        "task-c",
        "task-d",
        "task-e",
      ]);
    });
  });
});
