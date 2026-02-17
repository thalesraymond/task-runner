import { describe, it, expect } from "vitest";
import { TaskRunner } from "../src/TaskRunner.js";
import { TaskStep } from "../src/TaskStep.js";

describe("Continue On Error", () => {
  it("should skip dependent tasks if a dependency fails by default", async () => {
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
    ];

    const runner = new TaskRunner({});
    const results = await runner.execute(steps);

    expect(results.get("A")?.status).toBe("failure");
    expect(results.get("B")?.status).toBe("skipped");
  });

  it("should run dependent tasks if a dependency fails but has continueOnError: true", async () => {
    const steps: TaskStep<unknown>[] = [
      {
        name: "A",
        continueOnError: true,
        run: async () => ({ status: "failure", error: "Task A failed" }),
      },
      {
        name: "B",
        dependencies: ["A"],
        run: async () => ({ status: "success" }),
      },
    ];

    const runner = new TaskRunner({});
    const results = await runner.execute(steps);

    expect(results.get("A")?.status).toBe("failure");
    expect(results.get("A")?.error).toBe("Task A failed");
    expect(results.get("B")?.status).toBe("success");
  });

  it("should propagate success correctly after a continued failure", async () => {
    const steps: TaskStep<unknown>[] = [
      {
        name: "A",
        continueOnError: true,
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
    expect(results.get("B")?.status).toBe("success");
    expect(results.get("C")?.status).toBe("success");
  });

  it("should still skip dependents if a subsequent task fails without continueOnError", async () => {
    const steps: TaskStep<unknown>[] = [
      {
        name: "A",
        continueOnError: true,
        run: async () => ({ status: "failure" }),
      },
      {
        name: "B",
        dependencies: ["A"],
        run: async () => ({ status: "failure" }), // fails normally
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
    expect(results.get("B")?.status).toBe("failure");
    expect(results.get("C")?.status).toBe("skipped");
  });
});
