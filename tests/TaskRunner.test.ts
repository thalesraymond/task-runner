import { describe, it, expect } from "vitest";
import { TaskRunner } from "../src/TaskRunner.js";
import { TaskStep } from "../src/TaskStep.js";

describe("TaskRunner", () => {
  it("should run tasks in the correct sequential order", async () => {
    const executionOrder: string[] = [];
    const steps: TaskStep<unknown>[] = [
      {
        name: "A",
        run: async () => {
          executionOrder.push("A");
          return { status: "success" };
        },
      },
      {
        name: "B",
        dependencies: ["A"],
        run: async () => {
          executionOrder.push("B");
          return { status: "success" };
        },
      },
    ];

    const runner = new TaskRunner({});
    await runner.execute(steps);

    expect(executionOrder).toEqual(["A", "B"]);
  });

  it("should handle an empty list of tasks gracefully", async () => {
    const runner = new TaskRunner({});
    const results = await runner.execute([]);
    expect(results.size).toBe(0);
  });

  it("should run independent tasks in parallel", async () => {
    const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));
    const steps: TaskStep<unknown>[] = [
      {
        name: "A",
        run: async () => {
          await delay(100);
          return { status: "success" };
        },
      },
      {
        name: "B",
        run: async () => {
          await delay(100);
          return { status: "success" };
        },
      },
    ];

    const runner = new TaskRunner({});
    const startTime = Date.now();
    await runner.execute(steps);
    const endTime = Date.now();

    expect(endTime - startTime).toBeLessThan(200);
  });

  it("should skip dependent tasks if a root task fails", async () => {
    const steps: TaskStep<unknown>[] = [
      {
        name: "A",
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
    expect(results.get("B")?.status).toBe("skipped");
  });

  it.each([
    {
      name: "circular dependency",
      steps: [
        {
          name: "A",
          dependencies: ["B"],
          run: async () => ({ status: "success" }),
        },
        {
          name: "B",
          dependencies: ["A"],
          run: async () => ({ status: "success" }),
        },
      ],
      expectedError:
        /Task graph validation failed: Cycle detected: A -> B -> A/,
    },
    {
      name: "missing dependency",
      steps: [
        {
          name: "A",
          dependencies: ["B"],
          run: async () => ({ status: "success" }),
        },
      ],
      expectedError:
        /Task graph validation failed: Task 'A' depends on missing task 'B'/,
    },
  ])("should throw an error for $name", async ({ steps, expectedError }) => {
    const runner = new TaskRunner({});
    await expect(runner.execute(steps as TaskStep<unknown>[])).rejects.toThrow(
      expectedError
    );
  });

  it("should handle tasks that throw an error during execution", async () => {
    const steps: TaskStep<unknown>[] = [
      {
        name: "A",
        run: async () => {
          throw new Error("This task failed spectacularly");
        },
      },
    ];

    const runner = new TaskRunner({});
    const results = await runner.execute(steps);

    expect(results.get("A")?.status).toBe("failure");
    expect(results.get("A")?.error).toBe("This task failed spectacularly");
  });

  it("should skip tasks whose dependencies are skipped", async () => {
    const steps: TaskStep<unknown>[] = [
      { name: "A", run: async () => ({ status: "failure" }) },
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
  });

  it("should handle tasks that throw a non-Error object during execution", async () => {
    const steps: TaskStep<unknown>[] = [
      {
        name: "A",
        run: async () => {
          throw "Some string error";
        },
      },
    ];

    const runner = new TaskRunner({});
    const results = await runner.execute(steps);

    expect(results.get("A")?.status).toBe("failure");
    expect(results.get("A")?.error).toBe("Some string error");
  });

  it("should handle duplicate steps where one gets skipped due to failed dependency", async () => {
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
        name: "B",
        dependencies: ["A"],
        run: async () => ({ status: "success" }),
      },
    ];

    const runner = new TaskRunner({});

    await expect(runner.execute(steps)).rejects.toThrow(
      /Task graph validation failed: Duplicate task detected/
    );
  });
});
