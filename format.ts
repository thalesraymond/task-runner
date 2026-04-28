import { readFileSync, writeFileSync } from "fs";

let content = readFileSync("tests/TaskRunnerMermaid.test.ts", "utf-8");

// Since we appended the `it` statements directly to the end of the file, they are OUTSIDE of the `describe` block!
// Let's fix that.
content = content.replace(
`  it("should handle ID collisions by appending a counter", () => {
    const steps: TaskStep<unknown>[] = [
      { name: "Task 1", run: async () => ({ status: "success" }) },
      { name: "Task_1", run: async () => ({ status: "success" }) },
      { name: "Task:1", run: async () => ({ status: "success" }) },
    ];

    const graph = TaskRunner.getMermaidGraph(steps);
    const lines = graph.split("\\n");

    // All three sanitize to "Task_1" initially.
    // They should be disambiguated with suffix counters.
    expect(lines).toContain("  Task_1[\\"Task 1\\"]");
    expect(lines).toContain("  Task_1_1[\\"Task_1\\"]");
    expect(lines).toContain("  Task_1_2[\\"Task:1\\"]");
  });
});

  it("should evaluate uniqueId uniqueness boolean exactly", () => {`,
`  it("should handle ID collisions by appending a counter", () => {
    const steps: TaskStep<unknown>[] = [
      { name: "Task 1", run: async () => ({ status: "success" }) },
      { name: "Task_1", run: async () => ({ status: "success" }) },
      { name: "Task:1", run: async () => ({ status: "success" }) },
    ];

    const graph = TaskRunner.getMermaidGraph(steps);
    const lines = graph.split("\\n");

    // All three sanitize to "Task_1" initially.
    // They should be disambiguated with suffix counters.
    expect(lines).toContain("  Task_1[\\"Task 1\\"]");
    expect(lines).toContain("  Task_1_1[\\"Task_1\\"]");
    expect(lines).toContain("  Task_1_2[\\"Task:1\\"]");
  });

  it("should evaluate uniqueId uniqueness boolean exactly", () => {`
);

content += "\n});\n";

writeFileSync("tests/TaskRunnerMermaid.test.ts", content);
