import { describe, it, expect } from "vitest";
import { TaskRunner } from "../src/TaskRunner.js";
import { TaskStep } from "../src/TaskStep.js";

describe("Completion Dependencies (runCondition)", () => {
  it("Scenario 1: Success - A -> B(always). A succeeds. B runs.", async () => {
    const steps: TaskStep<unknown>[] = [
      {
        name: "A",
        run: async () => ({ status: "success" }),
      },
      {
        name: "B",
        dependencies: [{ step: "A", runCondition: "always" }],
        run: async () => ({ status: "success" }),
      },
    ];

    const runner = new TaskRunner({});
    const results = await runner.execute(steps);

    expect(results.get("A")?.status).toBe("success");
    expect(results.get("B")?.status).toBe("success");
  });

  it("Scenario 2: Failure - A -> B(always). A fails. B runs.", async () => {
    const steps: TaskStep<unknown>[] = [
      {
        name: "A",
        run: async () => ({ status: "failure", error: "A failed" }),
      },
      {
        name: "B",
        dependencies: [{ step: "A", runCondition: "always" }],
        run: async () => ({ status: "success" }),
      },
    ];

    const runner = new TaskRunner({});
    const results = await runner.execute(steps);

    expect(results.get("A")?.status).toBe("failure");
    expect(results.get("B")?.status).toBe("success");
  });

  it("Scenario 3: Skip - X(fail) -> A -> B(always). X fails, A skips. B skips.", async () => {
    const steps: TaskStep<unknown>[] = [
      {
        name: "X",
        run: async () => ({ status: "failure", error: "X failed" }),
      },
      {
        name: "A",
        dependencies: ["X"],
        run: async () => ({ status: "success" }),
      },
      {
        name: "B",
        dependencies: [{ step: "A", runCondition: "always" }],
        run: async () => ({ status: "success" }),
      },
    ];

    const runner = new TaskRunner({});
    const results = await runner.execute(steps);

    expect(results.get("X")?.status).toBe("failure");
    expect(results.get("A")?.status).toBe("skipped");
    expect(results.get("B")?.status).toBe("skipped");
  });

  it("Scenario 4: Hybrid - A(fail) -> B(always) -> C(standard). A fails, B runs, C runs (because B succeeded).", async () => {
    const steps: TaskStep<unknown>[] = [
      {
        name: "A",
        run: async () => ({ status: "failure", error: "A failed" }),
      },
      {
        name: "B",
        dependencies: [{ step: "A", runCondition: "always" }],
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
});
