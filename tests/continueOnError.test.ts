import { describe, it, expect } from "vitest";
import { TaskRunner } from "../src/TaskRunner.js";
import { TaskStep } from "../src/TaskStep.js";

interface TestContext {
  [key: string]: unknown;
}

describe("TaskRunner - Continue On Error", () => {
  it("should skip dependents when a task fails (default behavior)", async () => {
    const taskA: TaskStep<TestContext> = {
      name: "A",
      run: async () => ({ status: "failure", error: "Task A failed" }),
    };
    const taskB: TaskStep<TestContext> = {
      name: "B",
      dependencies: ["A"],
      run: async () => ({ status: "success" }),
    };

    const runner = new TaskRunner<TestContext>({});
    const results = await runner.execute([taskA, taskB]);

    expect(results.get("A")?.status).toBe("failure");
    expect(results.get("B")?.status).toBe("skipped");
    expect(results.get("B")?.message).toContain("dependency 'A' failed");
  });

  it("should execute dependent when a task fails with continueOnError: true", async () => {
    const taskA: TaskStep<TestContext> = {
      name: "A",
      continueOnError: true,
      run: async () => ({ status: "failure", error: "Task A failed but continued" }),
    };
    const taskB: TaskStep<TestContext> = {
      name: "B",
      dependencies: ["A"],
      run: async () => ({ status: "success" }),
    };

    const runner = new TaskRunner<TestContext>({});
    const results = await runner.execute([taskA, taskB]);

    expect(results.get("A")?.status).toBe("failure");
    expect(results.get("B")?.status).toBe("success");
  });

  it("should execute chain of dependents when a task fails with continueOnError: true", async () => {
    const taskA: TaskStep<TestContext> = {
      name: "A",
      continueOnError: true,
      run: async () => ({ status: "failure", error: "Task A failed but continued" }),
    };
    const taskB: TaskStep<TestContext> = {
      name: "B",
      dependencies: ["A"],
      run: async () => ({ status: "success" }),
    };
    const taskC: TaskStep<TestContext> = {
        name: "C",
        dependencies: ["B"],
        run: async () => ({ status: "success" }),
      };

    const runner = new TaskRunner<TestContext>({});
    const results = await runner.execute([taskA, taskB, taskC]);

    expect(results.get("A")?.status).toBe("failure");
    expect(results.get("B")?.status).toBe("success");
    expect(results.get("C")?.status).toBe("success");
  });

  it("should skip dependent if intermediate task fails without continueOnError", async () => {
    const taskA: TaskStep<TestContext> = {
        name: "A",
        continueOnError: true,
        run: async () => ({ status: "failure", error: "Task A failed but continued" }),
    };
    const taskB: TaskStep<TestContext> = {
        name: "B",
        dependencies: ["A"],
        run: async () => ({ status: "failure", error: "Task B failed" }),
    };
    const taskC: TaskStep<TestContext> = {
        name: "C",
        dependencies: ["B"],
        run: async () => ({ status: "success" }),
      };

    const runner = new TaskRunner<TestContext>({});
    const results = await runner.execute([taskA, taskB, taskC]);

    expect(results.get("A")?.status).toBe("failure");
    expect(results.get("B")?.status).toBe("failure");
    expect(results.get("C")?.status).toBe("skipped");
    expect(results.get("C")?.message).toContain("dependency 'B' failed");
  });
});
