import { describe, it, expect } from "vitest";
import { filterTasks } from "../src/utils/TaskFilter.js";
import { TaskStep } from "../src/TaskStep.js";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface TestContext {}

const createMockTask = (name: string, tags?: string[], dependencies?: string[]): TaskStep<TestContext> => ({
  name,
  tags,
  dependencies,
  run: async () => ({ status: "success" }),
});

describe("filterTasks", () => {
  const steps: TaskStep<TestContext>[] = [
    createMockTask("task1", ["frontend", "lint"]),
    createMockTask("task2", ["backend", "lint"]),
    createMockTask("task3", ["frontend", "build"], ["task1"]),
    createMockTask("task4", ["backend", "build"], ["task2"]),
    createMockTask("task5", ["deploy"], ["task3", "task4"]),
  ];

  it("should return all tasks when no filter is provided", () => {
    const result = filterTasks(steps, {});
    expect(result).toHaveLength(5);
    expect(result.map((r) => r.name)).toEqual(["task1", "task2", "task3", "task4", "task5"]);
  });

  it("should filter by includeNames", () => {
    const result = filterTasks(steps, { includeNames: ["task1", "task5"] });
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.name)).toEqual(["task1", "task5"]);
  });

  it("should filter by includeTags", () => {
    const result = filterTasks(steps, { includeTags: ["frontend"] });
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.name)).toEqual(["task1", "task3"]);
  });

  it("should filter by excludeNames", () => {
    const result = filterTasks(steps, { excludeNames: ["task1", "task2"] });
    expect(result).toHaveLength(3);
    expect(result.map((r) => r.name)).toEqual(["task3", "task4", "task5"]);
  });

  it("should filter by excludeTags", () => {
    const result = filterTasks(steps, { excludeTags: ["lint"] });
    expect(result).toHaveLength(3);
    expect(result.map((r) => r.name)).toEqual(["task3", "task4", "task5"]);
  });

  it("should apply exclusion over inclusion", () => {
    const result = filterTasks(steps, {
      includeTags: ["frontend"],
      excludeNames: ["task1"]
    });
    expect(result).toHaveLength(1);
    expect(result.map((r) => r.name)).toEqual(["task3"]);
  });

  it("should resolve dependencies when includeDependencies is true", () => {
    const result = filterTasks(steps, {
      includeNames: ["task5"],
      includeDependencies: true
    });
    // task5 depends on task3, task4. task3 depends on task1, task4 depends on task2
    expect(result).toHaveLength(5);
    expect(result.map((r) => r.name)).toEqual(["task1", "task2", "task3", "task4", "task5"]);
  });

  it("should not resolve dependencies when includeDependencies is false", () => {
    const result = filterTasks(steps, {
      includeNames: ["task5"],
      includeDependencies: false
    });
    expect(result).toHaveLength(1);
    expect(result.map((r) => r.name)).toEqual(["task5"]);
  });

  it("should handle missing dependencies gracefully when resolving", () => {
    const stepsWithMissingDep: TaskStep<TestContext>[] = [
      createMockTask("task1", ["tag1"]),
      createMockTask("task2", ["tag2"], ["missing_task"])
    ];

    const result = filterTasks(stepsWithMissingDep, {
      includeNames: ["task2"],
      includeDependencies: true
    });

    // Should return task2 and ignore missing_task gracefully
    expect(result).toHaveLength(1);
    expect(result.map((r) => r.name)).toEqual(["task2"]);
  });

  it("should cover fallback sorts when indices are undefined", () => {
    const stepsWithNoIndex: TaskStep<TestContext>[] = [
      createMockTask("task1", []),
      createMockTask("task2", [])
    ];

    // Test the fallback sort order `originalIndices.get(a.name) ?? 0`
    const result = filterTasks(stepsWithNoIndex, {});
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.name)).toEqual(["task1", "task2"]);
  });
});
