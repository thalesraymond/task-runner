import { describe, it, expect } from "vitest";
import { TaskRunner } from "../../src/TaskRunner.js";
import { TaskStep } from "../../src/TaskStep.js";

describe("Integration: Error Handling", () => {
  it("Scenario 3: Task failure and downstream skipping", async () => {
    const runner = new TaskRunner({});

    const steps: TaskStep<unknown>[] = [
      { name: "A", run: async () => ({ status: "success" }) },
      {
        name: "B",
        dependencies: ["A"],
        run: async () => ({ status: "failure", error: "Boom" }),
      },
      {
        name: "C",
        dependencies: ["B"],
        run: async () => ({ status: "success" }),
      },
      {
        name: "D",
        dependencies: ["A"], // Should still run as A succeeded
        run: async () => ({ status: "success" }),
      },
    ];

    const results = await runner.execute(steps);

    expect(results.get("A")?.status).toBe("success");
    expect(results.get("B")?.status).toBe("failure");
    expect(results.get("C")?.status).toBe("skipped"); // Skipped due to B failure
    expect(results.get("D")?.status).toBe("success"); // Not affected by B
  });

  it("Scenario 10: Circular dependency detection", async () => {
    const runner = new TaskRunner({});

    const steps: TaskStep<unknown>[] = [
      {
        name: "A",
        dependencies: ["B"],
        run: async () => ({ status: "success" }),
      },
      {
        name: "B",
        dependencies: ["C"],
        run: async () => ({ status: "success" }),
      },
      {
        name: "C",
        dependencies: ["A"],
        run: async () => ({ status: "success" }),
      },
    ];

    // Validation happens before execution starts
    await expect(runner.execute(steps)).rejects.toThrow(/Cycle detected/);
  });

  it("Scenario 11: Missing dependency handling", async () => {
    const runner = new TaskRunner({});

    const steps: TaskStep<unknown>[] = [
      {
        name: "A",
        dependencies: ["Ghost"],
        run: async () => ({ status: "success" }),
      },
    ];

    // Validation should catch this
    await expect(runner.execute(steps)).rejects.toThrow(
      /depends on missing task 'Ghost'/
    );
  });
});
