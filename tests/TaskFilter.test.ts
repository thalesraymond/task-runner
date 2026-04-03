import { describe, it, expect } from "vitest";
import { filterTasks } from "../src/utils/TaskFilter.js";
import { TaskStep } from "../src/TaskStep.js";
import { TaskStatus } from "../src/TaskStatus.js";

describe("filterTasks", () => {
  const defaultTaskRun = async () => ({ status: "success" as TaskStatus });
  const tasks: TaskStep<unknown>[] = [
    { name: "taskA", tags: ["backend", "core"], run: defaultTaskRun },
    { name: "taskB", tags: ["backend"], dependencies: ["taskA"], run: defaultTaskRun },
    { name: "taskC", tags: ["frontend"], run: defaultTaskRun },
    { name: "taskD", tags: ["frontend", "ui"], dependencies: ["taskC"], run: defaultTaskRun },
    { name: "taskE", dependencies: ["taskB", "taskD"], run: defaultTaskRun },
  ];

  it("should return all tasks if no inclusions or exclusions are provided", () => {
    const filtered = filterTasks(tasks, {});
    expect(filtered).toHaveLength(5);
    expect(filtered.map(t => t.name)).toEqual(["taskA", "taskB", "taskC", "taskD", "taskE"]);
  });

  it("should include tasks by specific names", () => {
    const filtered = filterTasks(tasks, { includeNames: ["taskA", "taskC"] });
    expect(filtered).toHaveLength(2);
    expect(filtered.map(t => t.name)).toEqual(["taskA", "taskC"]);
  });

  it("should include tasks by tags", () => {
    const filtered = filterTasks(tasks, { includeTags: ["backend"] });
    expect(filtered).toHaveLength(2);
    expect(filtered.map(t => t.name)).toEqual(["taskA", "taskB"]);
  });

  it("should exclude tasks by specific names", () => {
    const filtered = filterTasks(tasks, { excludeNames: ["taskB", "taskD", "taskE"] });
    expect(filtered).toHaveLength(2);
    expect(filtered.map(t => t.name)).toEqual(["taskA", "taskC"]);
  });

  it("should exclude tasks by tags", () => {
    const filtered = filterTasks(tasks, { excludeTags: ["backend"] });
    expect(filtered).toHaveLength(3);
    expect(filtered.map(t => t.name)).toEqual(["taskC", "taskD", "taskE"]);
  });

  it("should handle combinations of inclusions and exclusions", () => {
    // Include backend tasks but exclude taskB
    const filtered = filterTasks(tasks, { includeTags: ["backend"], excludeNames: ["taskB"] });
    expect(filtered).toHaveLength(1);
    expect(filtered.map(t => t.name)).toEqual(["taskA"]);
  });

  it("should include dependencies recursively when includeDependencies is true", () => {
    const filtered = filterTasks(tasks, { includeNames: ["taskE"], includeDependencies: true });
    // taskE depends on taskB and taskD
    // taskB depends on taskA
    // taskD depends on taskC
    // So all tasks should be included
    expect(filtered).toHaveLength(5);
    expect(filtered.map(t => t.name).sort()).toEqual(["taskA", "taskB", "taskC", "taskD", "taskE"].sort());
  });

  it("should not include dependencies when includeDependencies is false", () => {
    const filtered = filterTasks(tasks, { includeNames: ["taskE"], includeDependencies: false });
    expect(filtered).toHaveLength(1);
    expect(filtered.map(t => t.name)).toEqual(["taskE"]);
  });

  it("should handle exclusions even if includeDependencies pulls them in", () => {
    // Current implementation: Initial filtering applies inclusions and exclusions.
    // If includeDependencies is true, it recursively adds dependencies of *initially selected* tasks,
    // overriding exclusions for those dependencies if they weren't in the initial set.
    // This test verifies the current behavior, if we want strict exclusion we might need to modify filterTasks.
    // But currently, the design is: dependencies of included tasks are included.
    const filtered = filterTasks(tasks, { includeNames: ["taskB"], includeDependencies: true, excludeNames: ["taskA"] });
    expect(filtered.map(t => t.name).sort()).toEqual(["taskA", "taskB"].sort());
  });

  it("should include both name inclusions and tag inclusions", () => {
    const filtered = filterTasks(tasks, { includeNames: ["taskC"], includeTags: ["core"] });
    expect(filtered).toHaveLength(2);
    expect(filtered.map(t => t.name)).toEqual(["taskA", "taskC"]);
  });

  it("should ignore dependencies that do not exist in the steps array when resolving dependencies", () => {
    const missingDepTasks: TaskStep<unknown>[] = [
      { name: "task1", dependencies: ["nonExistent"], run: defaultTaskRun },
    ];
    const filtered = filterTasks(missingDepTasks, { includeNames: ["task1"], includeDependencies: true });
    // It should include task1, and since 'nonExistent' is not in the stepMap, it will not throw an error and will add it to selectedTasks but skip resolving it.
    expect(filtered).toHaveLength(1);
    expect(filtered.map(t => t.name)).toEqual(["task1"]);
  });
  it("should not crash if includeTags is uninitialized somehow", () => {
    // Calling with empty object defaults covered, now try forcing undefined
    const filtered = filterTasks(tasks, { includeTags: undefined, excludeTags: undefined });
    expect(filtered).toHaveLength(5);
  });
});
