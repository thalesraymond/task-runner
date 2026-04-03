import { describe, it, expect } from "vitest";
import { filterTasks } from "../src/utils/TaskFilter.js";
import { TaskStep } from "../src/TaskStep.js";

describe("TaskFilter", () => {
  const steps: TaskStep<unknown>[] = [
    { name: "A", tags: ["backend", "core"], run: async () => ({ status: "success" }) },
    { name: "B", dependencies: ["A"], tags: ["backend"], run: async () => ({ status: "success" }) },
    { name: "C", tags: ["frontend"], run: async () => ({ status: "success" }) },
    { name: "D", dependencies: ["C"], tags: ["frontend"], run: async () => ({ status: "success" }) },
    { name: "E", tags: ["utils"], run: async () => ({ status: "success" }) },
  ];

  it("should filter by includeTags", () => {
    const result = filterTasks(steps, { includeTags: ["backend"] });
    expect(result.map((s) => s.name)).toEqual(["A", "B"]);
  });

  it("should filter by includeNames", () => {
    const result = filterTasks(steps, { includeNames: ["C", "E"] });
    expect(result.map((s) => s.name)).toEqual(["C", "E"]);
  });

  it("should exclude by excludeTags", () => {
    const result = filterTasks(steps, { excludeTags: ["backend"] });
    expect(result.map((s) => s.name)).toEqual(["C", "D", "E"]);
  });

  it("should exclude by excludeNames", () => {
    const result = filterTasks(steps, { excludeNames: ["A", "D"] });
    expect(result.map((s) => s.name)).toEqual(["B", "C", "E"]);
  });

  it("should prioritize exclusion over inclusion", () => {
    const result = filterTasks(steps, {
      includeTags: ["backend"],
      excludeNames: ["B"],
    });
    expect(result.map((s) => s.name)).toEqual(["A"]);
  });

  it("should return all tasks when no filters are provided", () => {
    const result = filterTasks(steps, {});
    expect(result).toHaveLength(steps.length);
  });

  it("should recursively include dependencies when includeDependencies is true", () => {
    const result = filterTasks(steps, {
      includeNames: ["B", "D"], // Needs A and C respectively
      includeDependencies: true,
    });
    // Expected order matters based on the original array: A, B, C, D
    expect(result.map((s) => s.name).sort()).toEqual(["A", "B", "C", "D"].sort());
  });

  it("should respect exclusion rules even when gathering dependencies", () => {
    const result = filterTasks(steps, {
      includeNames: ["B"], // Needs A
      excludeNames: ["A"], // Exclude A explicitly
      includeDependencies: true,
    });
    expect(result.map((s) => s.name)).toEqual(["B"]);
  });
  it("should return true when dependency step is not found during inclusion", () => {
    // This is to cover the `!depStep` branch during dependency inclusion.
    const malformedSteps: TaskStep<unknown>[] = [
      { name: "A", dependencies: ["Missing"], run: async () => ({ status: "success" }) },
    ];
    const result = filterTasks(malformedSteps, {
      includeNames: ["A"],
      includeDependencies: true,
    });
    expect(result.map((s) => s.name)).toEqual(["A"]);
  });

  it("should cover fallback condition for missing tags when excluding tags", () => {
    // This is to cover the missing tag branch for excludeTags
    const stepsWithoutTags: TaskStep<unknown>[] = [
      { name: "A", run: async () => ({ status: "success" }) },
    ];
    const result = filterTasks(stepsWithoutTags, { excludeTags: ["foo"] });
    expect(result.map((s) => s.name)).toEqual(["A"]);
  });

  it("should exclude dependencies by tag properly", () => {
    // This covers `isExcludedByTag` during includeDependencies.
    const stepsWithDeps: TaskStep<unknown>[] = [
      { name: "A", run: async () => ({ status: "success" }) },
      { name: "B", dependencies: ["A"], tags: ["ignore-this"], run: async () => ({ status: "success" }) },
      { name: "C", dependencies: ["B"], run: async () => ({ status: "success" }) },
    ];
    const result = filterTasks(stepsWithDeps, {
      includeNames: ["C"],
      excludeTags: ["ignore-this"],
      includeDependencies: true,
    });
    expect(result.map((s) => s.name)).toEqual(["C"]); // B is ignored, A is thus not reached via C->B.
  });
});
