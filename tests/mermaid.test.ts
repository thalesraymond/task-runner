
import { describe, it, expect } from "vitest";
import { TaskRunner } from "../src/TaskRunner.js";
import { TaskStep } from "../src/TaskStep.js";

describe("TaskRunner Mermaid Graph", () => {
  it("should generate graph for single task", () => {
    const steps: TaskStep<unknown>[] = [{ name: "A", run: async () => ({ status: "success" }) }];
    const graph = TaskRunner.getMermaidGraph(steps);
    expect(graph).toContain("graph TD");
    expect(graph).toContain("  A");
  });

  it("should generate graph for linear dependencies", () => {
    const steps: TaskStep<unknown>[] = [
      { name: "A", run: async () => ({ status: "success" }) },
      { name: "B", dependencies: ["A"], run: async () => ({ status: "success" }) },
    ];
    const graph = TaskRunner.getMermaidGraph(steps);
    expect(graph).toContain("graph TD");
    expect(graph).toContain("  A --> B");
  });

  it("should generate graph for branching dependencies", () => {
    const steps: TaskStep<unknown>[] = [
      { name: "A", run: async () => ({ status: "success" }) },
      { name: "B", dependencies: ["A"], run: async () => ({ status: "success" }) },
      { name: "C", dependencies: ["A"], run: async () => ({ status: "success" }) },
      { name: "D", dependencies: ["B", "C"], run: async () => ({ status: "success" }) },
    ];
    const graph = TaskRunner.getMermaidGraph(steps);
    expect(graph).toContain("graph TD");
    expect(graph).toContain("  A --> B");
    expect(graph).toContain("  A --> C");
    expect(graph).toContain("  B --> D");
    expect(graph).toContain("  C --> D");
  });

  it("should handle disconnected graphs", () => {
      const steps: TaskStep<unknown>[] = [
          { name: "A", run: async () => ({ status: "success" }) },
          { name: "B", run: async () => ({ status: "success" }) },
      ];
      const graph = TaskRunner.getMermaidGraph(steps);
      expect(graph).toContain("graph TD");
      expect(graph).toContain("  A");
      expect(graph).toContain("  B");
  });

  it("should handle tasks defined after being used as dependency", () => {
    const steps: TaskStep<unknown>[] = [
      { name: "B", dependencies: ["A"], run: async () => ({ status: "success" }) },
      { name: "A", run: async () => ({ status: "success" }) },
    ];
    const graph = TaskRunner.getMermaidGraph(steps);
    expect(graph).toContain("graph TD");
    expect(graph).toContain("  A --> B");
  });
});
