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
    // Task_Quote_["Task&quot;Quote&quot;"]
    expect(lines).toContain("  Task_Quote_[\"Task&quot;Quote&quot;\"]");
    expect(lines).toContain("  Task_With_Space --> Task_Colon");
  });

  it("should sanitize brackets and parentheses", () => {
    const steps: TaskStep<unknown>[] = [
      { name: "Task[1]", run: async () => ({ status: "success" }) },
      { name: "Task(2)", run: async () => ({ status: "success" }) },
      { name: "Task{3}", run: async () => ({ status: "success" }) },
    ];

    const graph = TaskRunner.getMermaidGraph(steps);
    const lines = graph.split("\n");

    expect(lines).toContain("  Task_1_[\"Task&#91;1&#93;\"]");
    expect(lines).toContain("  Task_2_[\"Task&#40;2&#41;\"]");
    expect(lines).toContain("  Task_3_[\"Task&#123;3&#125;\"]");
  });

  it("should handle ID collisions by appending a counter", () => {
    const steps: TaskStep<unknown>[] = [
      { name: "Task 1", run: async () => ({ status: "success" }) },
      { name: "Task_1", run: async () => ({ status: "success" }) },
      { name: "Task:1", run: async () => ({ status: "success" }) },
    ];

    const graph = TaskRunner.getMermaidGraph(steps);
    const lines = graph.split("\n");

    // All three sanitize to "Task_1" initially.
    // They should be disambiguated with suffix counters.
    expect(lines).toContain("  Task_1[\"Task 1\"]");
    expect(lines).toContain("  Task_1_1[\"Task_1\"]");
    expect(lines).toContain("  Task_1_2[\"Task:1\"]");
  });

  it("should evaluate uniqueId uniqueness boolean exactly", () => {
    const steps: TaskStep<unknown>[] = [
      { name: "Task 1", run: async () => ({ status: "success" }) },
      { name: "Task_1", run: async () => ({ status: "success" }) }
    ];
    const rawGraph = TaskRunner.getMermaidGraph(steps);
    // Task_1 maps to Task_1. Task 1 maps to Task_1. They collide.
    // One becomes Task_1, other becomes Task_1_1.
    // We check that usedIds block triggers appropriately.
    expect(rawGraph).toContain("Task_1_1");
  });

  it("should check sizeBefore vs processedNodes length perfectly", () => {
    // A duplicate task in steps array will NOT increase processedNodes size, so it hits the if !== sizeBefore early exit false.
    const steps: TaskStep<unknown>[] = [
      { name: "A", run: async () => ({ status: "success" }) },
      // Exact duplicate object reference or just exact name?
      // getUniqueId caches the mapping, so same name means same uniqueId.
      { name: "A", run: async () => ({ status: "success" }) }
    ];
    const rawGraph = TaskRunner.getMermaidGraph(steps);
    // Graph should contain A exactly once.
    expect((rawGraph.match(/A\[/g) || []).length).toBe(1);
  });

  it("should enforce counter condition properly", () => {
    // We want to kill the mutants around if (counter > 1) { baseIdCounters.set(sanitized, counter); }
    // If we skip the `baseIdCounters.set`, the loop will just re-evaluate `usedIds.has` starting from 1 every time.
    // It is just an optimization but we can test that it evaluates to false if we don't have collisions.
    const steps: TaskStep<unknown>[] = [
      { name: "B", run: async () => ({ status: "success" }) }
    ];
    const rawGraph = TaskRunner.getMermaidGraph(steps);
    expect(rawGraph).toContain("B[\"B\"]");
  });

  it("should enforce usedIds boolean check precisely", () => {
    // We want to kill if (!usedIds.has(uniqueId)) { ... } mutations.
    // If the block is completely skipped (BlockStatement mutant), or the condition becomes false,
    // the code proceeds to the counter loop where counter starts at 1, checks uniqueId + "_1" -> "A_1".
    // So "A" would erroneously map to "A_1".
    const steps: TaskStep<unknown>[] = [
      { name: "FirstTask", run: async () => ({ status: "success" }) }
    ];
    const rawGraph = TaskRunner.getMermaidGraph(steps);
    // It should map to "FirstTask", NOT "FirstTask_1".
    expect(rawGraph).toContain("FirstTask[\"FirstTask\"]");
    expect(rawGraph).not.toContain("FirstTask_1");
  });



});
