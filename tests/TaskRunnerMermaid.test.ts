import { describe, it, expect } from "vitest";
import { TaskRunner } from "../src/TaskRunner.js";
import { TaskStep } from "../src/TaskStep.js";

describe("TaskRunner Mermaid Graph", () => {
  it("should generate a simple graph with no dependencies", () => {
    const steps: TaskStep<unknown>[] = [
      { name: "A", run: async () => ({ status: "success" }) },
      { name: "B", run: async () => ({ status: "success" }) },
    ];

    const graph = TaskRunner.getMermaidGraph(steps);
    const lines = graph.split("\n");

    expect(lines[0]).toBe("graph TD");
    expect(lines).toContain("  A[\"A\"]");
    expect(lines).toContain("  B[\"B\"]");
  });

  it("should generate a graph with dependencies", () => {
    const steps: TaskStep<unknown>[] = [
      { name: "A", run: async () => ({ status: "success" }) },
      {
        name: "B",
        dependencies: ["A"],
        run: async () => ({ status: "success" }),
      },
      {
        name: "C",
        dependencies: ["A"],
        run: async () => ({ status: "success" }),
      },
      {
        name: "D",
        dependencies: ["B", "C"],
        run: async () => ({ status: "success" }),
      },
    ];

    const graph = TaskRunner.getMermaidGraph(steps);
    const lines = graph.split("\n");

    expect(lines[0]).toBe("graph TD");
    expect(lines).toContain("  A --> B");
    expect(lines).toContain("  A --> C");
    expect(lines).toContain("  B --> D");
    expect(lines).toContain("  C --> D");
  });

  it("should handle mixed independent and dependent tasks", () => {
    const steps: TaskStep<unknown>[] = [
      { name: "Independent", run: async () => ({ status: "success" }) },
      { name: "A", run: async () => ({ status: "success" }) },
      {
        name: "B",
        dependencies: ["A"],
        run: async () => ({ status: "success" }),
      },
    ];

    const graph = TaskRunner.getMermaidGraph(steps);
    const lines = graph.split("\n");

    expect(lines).toContain("  Independent[\"Independent\"]");
    expect(lines).toContain("  A --> B");
  });

  it("should handle special characters in task names", () => {
    const steps: TaskStep<unknown>[] = [
      { name: "Task With Space", run: async () => ({ status: "success" }) },
      { name: "Task\"Quote\"", run: async () => ({ status: "success" }) },
      {
        name: "Task:Colon",
        dependencies: ["Task With Space"],
        run: async () => ({ status: "success" }),
      },
    ];

    const graph = TaskRunner.getMermaidGraph(steps);
    const lines = graph.split("\n");

    expect(lines).toContain("  Task_With_Space[\"Task With Space\"]");
    // "Task\"Quote\""["Task\"Quote\""]
    expect(lines).toContain("  Task_Quote[\"Task\\\"Quote\\\"\"]");
    expect(lines).toContain("  Task_With_Space --> Task_Colon");
  });

  it("should generate unique IDs for tasks when sanitization causes collision", () => {
    const steps: TaskStep<unknown>[] = [
      { name: "Task A", run: async () => ({ status: "success" }) },
      { name: "Task_A", run: async () => ({ status: "success" }) },
    ];

    const graph = TaskRunner.getMermaidGraph(steps);
    const lines = graph.split("\n");

    const ids = lines
      .filter((line) => line.includes("["))
      .map((line) => line.split("[")[0].trim());

    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(2);
    expect(ids).toContain("Task_A");
    expect(ids).toContain("Task_A_1");
  });

  it("should ignore dependencies that are not in the steps list", () => {
    const steps: TaskStep<unknown>[] = [
      {
        name: "A",
        dependencies: ["Missing"],
        run: async () => ({ status: "success" }),
      },
    ];

    const graph = TaskRunner.getMermaidGraph(steps);
    const lines = graph.split("\n");

    expect(lines).toContain('  A["A"]');

    // Actually, let's just check no arrows.
    const arrowLines = lines.filter(l => l.includes("-->"));
    expect(arrowLines.length).toBe(0);
  });
});
