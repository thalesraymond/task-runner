import { describe, it, expect, vi } from "vitest";
import { filterTasks } from "../src/utils/TaskFilter.js";
import { TaskStep } from "../src/TaskStep.js";
import { TaskResult } from "../src/TaskResult.js";

describe("TaskFilter", () => {
  const mockRun = vi.fn().mockResolvedValue({ status: "success" } as TaskResult);

  const steps: TaskStep<unknown>[] = [
    { name: "taskA", tags: ["frontend", "build"], run: mockRun },
    { name: "taskB", tags: ["backend", "build"], dependencies: ["taskA"], run: mockRun },
    { name: "taskC", tags: ["frontend", "test"], run: mockRun },
    { name: "taskD", dependencies: ["taskB"], run: mockRun },
    { name: "taskE", tags: ["deploy"], dependencies: ["taskC", "taskD"], run: mockRun },
  ];

  it("should include tasks by exact names", () => {
    const result = filterTasks(steps, { includeNames: ["taskA", "taskC"] });
    expect(result.map((s) => s.name)).toEqual(["taskA", "taskC"]);
  });

  it("should include tasks by tags", () => {
    const result = filterTasks(steps, { includeTags: ["frontend"] });
    expect(result.map((s) => s.name)).toEqual(["taskA", "taskC"]);
  });

  it("should include tasks matching either names or tags", () => {
    const result = filterTasks(steps, {
      includeNames: ["taskD"],
      includeTags: ["test"],
    });
    expect(result.map((s) => s.name)).toEqual(["taskC", "taskD"]);
  });

  it("should handle includeTags when includeNames is undefined", () => {
    const result = filterTasks(steps, {
      includeNames: undefined,
      includeTags: ["test"],
    });
    expect(result.map((s) => s.name)).toEqual(["taskC"]);
  });

  it("should handle includeNames when includeTags is undefined", () => {
    const result = filterTasks(steps, {
      includeNames: ["taskD"],
      includeTags: undefined,
    });
    expect(result.map((s) => s.name)).toEqual(["taskD"]);
  });

  it("should exclude tasks by exact names", () => {
    const result = filterTasks(steps, { excludeNames: ["taskB", "taskC"] });
    expect(result.map((s) => s.name)).toEqual(["taskA", "taskD", "taskE"]);
  });

  it("should exclude tasks by tags", () => {
    const result = filterTasks(steps, { excludeTags: ["build"] });
    expect(result.map((s) => s.name)).toEqual(["taskC", "taskD", "taskE"]);
  });

  it("should exclude taking precedence over include", () => {
    const result = filterTasks(steps, {
      includeTags: ["frontend"],
      excludeNames: ["taskC"],
    });
    expect(result.map((s) => s.name)).toEqual(["taskA"]);
  });

  it("should include dependencies when includeDependencies is true", () => {
    const result = filterTasks(steps, {
      includeNames: ["taskD"],
      includeDependencies: true,
    });
    // taskD depends on taskB, which depends on taskA
    expect(result.map((s) => s.name)).toEqual(["taskA", "taskB", "taskD"]);
  });

  it("should not include excluded dependencies even if includeDependencies is true", () => {
    const result = filterTasks(steps, {
      includeNames: ["taskE"],
      includeDependencies: true,
      excludeTags: ["backend"],
    });
    expect(result.map((s) => s.name).sort()).toEqual(["taskC", "taskD", "taskE"].sort());
  });

  it("should not include excluded dependencies by name even if includeDependencies is true", () => {
    const result = filterTasks(steps, {
      includeNames: ["taskD"],
      includeDependencies: true,
      excludeNames: ["taskB"],
    });
    // taskD depends on taskB, which is excluded by name.
    expect(result.map((s) => s.name)).toEqual(["taskD"]);
  });

  it("should handle missing dependencies gracefully when includeDependencies is true", () => {
    const missingDepSteps: TaskStep<unknown>[] = [
      { name: "task1", dependencies: ["missingTask"], run: mockRun }
    ];
    const result = filterTasks(missingDepSteps, {
      includeNames: ["task1"],
      includeDependencies: true,
    });
    expect(result.map((s) => s.name)).toEqual(["task1"]);
  });

  it("should handle default inclusion when neither includeNames nor includeTags are present but there is a truthy config with no properties matching", () => {
    const result = filterTasks(steps, { includeNames: [], includeTags: [] });
    expect(result.map((s) => s.name)).toEqual(["taskA", "taskB", "taskC", "taskD", "taskE"]);
  });

  it("should default to false if both include criteria exist but neither is matched", () => {
    const stepMissingBoth: TaskStep<unknown>[] = [
      { name: "taskNonMatching", run: mockRun }
    ];
    const result = filterTasks(stepMissingBoth, { includeNames: ["a"], includeTags: ["b"] });
    expect(result.map((s) => s.name)).toEqual([]);
  });

  it("should handle empty exclusions", () => {
    const result = filterTasks(steps, { excludeNames: [], excludeTags: [] });
    expect(result.map((s) => s.name)).toEqual(["taskA", "taskB", "taskC", "taskD", "taskE"]);
  });

  it("should handle exclude tags gracefully if tasks have no tags", () => {
    const taskWithoutTags: TaskStep<unknown>[] = [
      { name: "noTagTask", run: mockRun }
    ];
    const result = filterTasks(taskWithoutTags, { excludeTags: ["frontend"] });
    expect(result.map((s) => s.name)).toEqual(["noTagTask"]);
  });

  it("should default to included if inclusion conditions exists but are mutually falsy because missing values", () => {
    const result = filterTasks(steps, { includeNames: [], includeTags: [] });
    expect(result.map((s) => s.name)).toEqual(["taskA", "taskB", "taskC", "taskD", "taskE"]);
  });

  it("should handle both includeNames and includeTags logic correctly", () => {
    const mixedSteps: TaskStep<unknown>[] = [
      { name: "taskA", tags: ["frontend"], run: mockRun },
      { name: "taskB", tags: ["backend"], run: mockRun },
      { name: "taskC", tags: ["other"], run: mockRun },
    ];
    // taskA matched by name, taskB matched by tag
    const result = filterTasks(mixedSteps, { includeNames: ["taskA"], includeTags: ["backend"] });
    expect(result.map((s) => s.name)).toEqual(["taskA", "taskB"]);
  });

  it("should return all tasks when no inclusion/exclusion criteria are provided", () => {
    const result = filterTasks(steps, {});
    expect(result.map((s) => s.name)).toEqual(["taskA", "taskB", "taskC", "taskD", "taskE"]);
  });
});
