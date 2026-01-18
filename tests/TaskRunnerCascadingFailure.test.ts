import { describe, it, expect } from "vitest";
import { TaskRunner } from "../src/TaskRunner.js";
import { TaskStep } from "../src/TaskStep.js";

describe("TaskRunner - Cascading Failure", () => {
  it("should mark all dependent tasks as skipped when root task fails", async () => {
    const steps: TaskStep<unknown>[] = [
      {
        name: "A",
        run: async () => ({ status: "failure" }),
      },
      {
        name: "B",
        dependencies: ["A"],
        run: async () => ({ status: "success" }),
      },
      {
        name: "C",
        dependencies: ["B"],
        run: async () => ({ status: "success" }),
      },
    ];

    const runner = new TaskRunner({});
    const results = await runner.execute(steps);

    expect(results.get("A")?.status).toBe("failure");
    expect(results.get("B")?.status).toBe("skipped");
    expect(results.get("C")?.status).toBe("skipped");
    expect(results.size).toBe(3);
  });
});
