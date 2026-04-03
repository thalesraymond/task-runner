import { describe, it, expect, vi } from "vitest";
import { filterTasks } from "../../src/utils/TaskFilter.js";
import { TaskStep } from "../../src/TaskStep.js";

describe("filterTasks", () => {
  const steps: TaskStep<unknown>[] = [
    { name: "build", tags: ["backend", "core"], run: vi.fn() },
    { name: "test", dependencies: ["build"], tags: ["backend", "testing"], run: vi.fn() },
    { name: "lint", tags: ["frontend", "core"], run: vi.fn() },
    { name: "deploy", dependencies: ["test", "lint"], tags: ["ops"], run: vi.fn() },
    { name: "isolated", tags: ["frontend"], run: vi.fn() }
  ];

  it("should return all tasks if no filter provided", () => {
    const result = filterTasks(steps, {});
    expect(result.length).toBe(5);
  });

  it("should include tasks by tag", () => {
    const result = filterTasks(steps, { includeTags: ["backend"] });
    expect(result.map(s => s.name)).toEqual(["build", "test"]);
  });

  it("should include tasks by name", () => {
    const result = filterTasks(steps, { includeNames: ["lint"] });
    expect(result.map(s => s.name)).toEqual(["lint"]);
  });

  it("should exclude tasks by tag", () => {
    const result = filterTasks(steps, { excludeTags: ["ops"] });
    expect(result.map(s => s.name)).toEqual(["build", "test", "lint", "isolated"]);
  });

  it("should exclude tasks by name", () => {
    const result = filterTasks(steps, { excludeNames: ["isolated"] });
    expect(result.map(s => s.name)).toEqual(["build", "test", "lint", "deploy"]);
  });

  it("should handle both include and exclude logic", () => {
    const result = filterTasks(steps, { includeTags: ["core"], excludeNames: ["lint"] });
    expect(result.map(s => s.name)).toEqual(["build"]);
  });

  it("should automatically include dependencies if includeDependencies is true", () => {
    // 'deploy' depends on 'test' and 'lint', 'test' depends on 'build'
    const result = filterTasks(steps, { includeNames: ["deploy"], includeDependencies: true });
    expect(result.map(s => s.name)).toEqual(["build", "test", "lint", "deploy"]);
  });

  it("should not include dependencies if includeDependencies is false", () => {
    const result = filterTasks(steps, { includeNames: ["deploy"], includeDependencies: false });
    expect(result.map(s => s.name)).toEqual(["deploy"]);
  });

  it("should exclude dependencies that match exclude rules", () => {
    // Even if 'test' brings in 'build', if 'build' is explicitly excluded, it shouldn't be included.
    const result = filterTasks(steps, { includeNames: ["deploy"], excludeTags: ["backend"], includeDependencies: true });
    // 'deploy' includes 'test' & 'lint'. 'test' includes 'build'.
    // 'test' has tag 'backend' -> excluded.
    // 'build' has tag 'backend' -> excluded.
    // So only 'lint' and 'deploy' remain.
    expect(result.map(s => s.name)).toEqual(["lint", "deploy"]);
  });
});
