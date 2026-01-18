import { describe, it, expect } from "vitest";
import { TaskRunner } from "../src/TaskRunner.js";
import { TaskStep } from "../src/TaskStep.js";

describe("TaskRunner getMermaidGraph", () => {
  it("should generate a simple graph", () => {
    const steps: TaskStep<unknown>[] = [
      { name: "A", run: async () => ({ status: "success" }) },
      { name: "B", dependencies: ["A"], run: async () => ({ status: "success" }) },
    ];

    const graph = TaskRunner.getMermaidGraph(steps);
    const lines = graph.split("\n");

    expect(lines).toContain("graph TD");
    expect(lines).toContain("  A");
    expect(lines).toContain("  B");
    expect(lines).toContain("  A --> B");
  });

  it("should handle isolated nodes", () => {
    const steps: TaskStep<unknown>[] = [
      { name: "A", run: async () => ({ status: "success" }) },
      { name: "B", run: async () => ({ status: "success" }) },
    ];

    const graph = TaskRunner.getMermaidGraph(steps);
    const lines = graph.split("\n");

    expect(lines).toContain("graph TD");
    expect(lines).toContain("  A");
    expect(lines).toContain("  B");
    // Ensure no edges
    expect(lines.some((l) => l.includes("-->"))).toBe(false);
  });

  it("should sanitize names with spaces", () => {
    const steps: TaskStep<unknown>[] = [
      { name: "Task A", run: async () => ({ status: "success" }) },
      { name: "Task B", dependencies: ["Task A"], run: async () => ({ status: "success" }) },
    ];

    const graph = TaskRunner.getMermaidGraph(steps);
    const lines = graph.split("\n");

    expect(lines).toContain("  \"Task A\"");
    expect(lines).toContain("  \"Task B\"");
    expect(lines).toContain("  \"Task A\" --> \"Task B\"");
  });

  it("should handle multiple dependencies", () => {
    const steps: TaskStep<unknown>[] = [
      { name: "A", run: async () => ({ status: "success" }) },
      { name: "B", run: async () => ({ status: "success" }) },
      { name: "C", dependencies: ["A", "B"], run: async () => ({ status: "success" }) },
    ];

    const graph = TaskRunner.getMermaidGraph(steps);
    const lines = graph.split("\n");

    expect(lines).toContain("  A --> C");
    expect(lines).toContain("  B --> C");
  });
});
