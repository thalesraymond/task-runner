import { describe, it, expect } from "vitest";
import { filterTasks } from "../src/utils/TaskFilter.js";
import { TaskStep } from "../src/TaskStep.js";

describe("TaskFilter", () => {
  const steps: TaskStep<unknown>[] = [
    { name: "lint", tags: ["ci", "quick"], run: async () => ({ status: "success" }) },
    { name: "build", tags: ["ci", "slow"], dependencies: ["lint"], run: async () => ({ status: "success" }) },
    { name: "test", tags: ["ci"], dependencies: ["build"], run: async () => ({ status: "success" }) },
    { name: "deploy", tags: ["cd"], dependencies: ["test"], run: async () => ({ status: "success" }) },
    { name: "clean", tags: ["quick"], run: async () => ({ status: "success" }) },
  ];

  it("should return all tasks when no filter is provided", () => {
    const result = filterTasks(steps, {});
    expect(result.length).toBe(5);
  });

  it("should include tasks by tag", () => {
    const result = filterTasks(steps, { includeTags: ["quick"] });
    expect(result.length).toBe(2);
    expect(result.map(s => s.name)).toEqual(expect.arrayContaining(["lint", "clean"]));
  });

  it("should include tasks by name", () => {
    const result = filterTasks(steps, { includeNames: ["build"] });
    expect(result.length).toBe(1);
    expect(result[0].name).toBe("build");
  });

  it("should exclude tasks by tag", () => {
    const result = filterTasks(steps, { excludeTags: ["slow"] });
    expect(result.length).toBe(4);
    expect(result.map(s => s.name)).not.toContain("build");
  });

  it("should exclude tasks by name", () => {
    const result = filterTasks(steps, { excludeNames: ["deploy"] });
    expect(result.length).toBe(4);
    expect(result.map(s => s.name)).not.toContain("deploy");
  });

  it("should handle exclusion precedence over inclusion", () => {
    const result = filterTasks(steps, { includeTags: ["ci"], excludeTags: ["slow"] });
    expect(result.length).toBe(2); // "lint", "test"
    expect(result.map(s => s.name)).toEqual(expect.arrayContaining(["lint", "test"]));
    expect(result.map(s => s.name)).not.toContain("build");
  });

  it("should include dependencies when includeDependencies is true", () => {
    const result = filterTasks(steps, { includeNames: ["deploy"], includeDependencies: true });
    expect(result.length).toBe(4); // "deploy", "test", "build", "lint"
    expect(result.map(s => s.name)).toEqual(expect.arrayContaining(["deploy", "test", "build", "lint"]));
    expect(result.map(s => s.name)).not.toContain("clean");
  });

  it("should ignore missing dependencies during resolution without crashing", () => {
    const stepsWithMissingDep: TaskStep<unknown>[] = [
      { name: "taskA", dependencies: ["missingTask"], run: async () => ({ status: "success" }) }
    ];
    const result = filterTasks(stepsWithMissingDep, { includeNames: ["taskA"], includeDependencies: true });
    expect(result.length).toBe(1);
    expect(result[0].name).toBe("taskA");
  });

  it("should handle recursive dependencies correctly without error", () => {
    const recursiveSteps: TaskStep<unknown>[] = [
      { name: "taskB", dependencies: ["taskB_dep"], run: async () => ({ status: "success" }) },
      { name: "taskB_dep", run: async () => ({ status: "success" }) },
    ];
    const result = filterTasks(recursiveSteps, { includeNames: ["taskB"], includeDependencies: true });
    expect(result.length).toBe(2);
    expect(result.map(s => s.name)).toEqual(expect.arrayContaining(["taskB", "taskB_dep"]));
  });

  it("should handle circular dependencies by avoiding infinite loops", () => {
    const circularSteps: TaskStep<unknown>[] = [
      { name: "taskC", dependencies: ["taskD"], run: async () => ({ status: "success" }) },
      { name: "taskD", dependencies: ["taskC"], run: async () => ({ status: "success" }) },
    ];
    const result = filterTasks(circularSteps, { includeNames: ["taskC"], includeDependencies: true });
    expect(result.length).toBe(2);
    expect(result.map(s => s.name)).toEqual(expect.arrayContaining(["taskC", "taskD"]));
  });
});
