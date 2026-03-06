import { describe, it, expect, vi } from "vitest";
import { TaskRunner } from "../src/TaskRunner.js";
import { TaskStep } from "../src/TaskStep.js";
import { TaskGraphValidationError } from "../src/TaskGraphValidationError.js";
import { IExecutionStrategy } from "../src/strategies/IExecutionStrategy.js";

describe("TaskRunner", () => {
  it("should execute teardown tasks configured with runCondition: 'always' even if a dependency fails", async () => {
    const executionOrder: string[] = [];
    const context = { data: "" };

    const steps: TaskStep<typeof context>[] = [
      {
        name: "Provision",
        run: async () => {
          executionOrder.push("Provision");
          return { status: "success" };
        },
      },
      {
        name: "Test",
        dependencies: ["Provision"],
        run: async () => {
          executionOrder.push("Test");
          return { status: "failure", error: "tests failed" };
        },
      },
      {
        name: "Deprovision",
        dependencies: [{ step: "Test", runCondition: "always" }],
        run: async () => {
          executionOrder.push("Deprovision");
          return { status: "success" };
        },
      },
      {
        name: "Publish Results",
        dependencies: ["Test"],
        run: async () => {
          executionOrder.push("Publish Results");
          return { status: "success" };
        },
      },
    ];

    const runner = new TaskRunner(context);
    const results = await runner.execute(steps);

    // Verify order of execution
    expect(executionOrder).toEqual(["Provision", "Test", "Deprovision"]);

    // Verify correct statuses
    expect(results.get("Provision")?.status).toBe("success");
    expect(results.get("Test")?.status).toBe("failure");
    expect(results.get("Deprovision")?.status).toBe("success");

    // The dependent task that requires "Test" to succeed should be skipped
    expect(results.get("Publish Results")?.status).toBe("skipped");
  });

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

  it("should throw TaskGraphValidationError with detailed result", async () => {
    const steps: TaskStep<unknown>[] = [
      {
        name: "A",
        dependencies: ["B"],
        run: async () => ({ status: "success" }),
      },
    ];

    const runner = new TaskRunner({});
    expect.assertions(4);
    try {
      await runner.execute(steps);
    } catch (error) {
      expect(error).toBeInstanceOf(TaskGraphValidationError);
      if (error instanceof TaskGraphValidationError) {
        expect(error.result.isValid).toBe(false);
        expect(error.result.errors[0].type).toBe("missing_dependency");
        expect(error.result.errors[0].details).toEqual({
          taskId: "A",
          missingDependencyId: "B",
        });
      }
    }
  });

  it("should allow unsubscribing from events", async () => {
    const runner = new TaskRunner({});
    const callback = vi.fn();
    runner.on("taskStart", callback);
    runner.off("taskStart", callback);

    const steps: TaskStep<unknown>[] = [
      {
        name: "A",
        run: async () => ({ status: "success" }),
      },
    ];

    await runner.execute(steps);
    expect(callback).not.toHaveBeenCalled();
  });

  it("should allow setting a custom execution strategy", async () => {
    const customStrategy: IExecutionStrategy<unknown> = {
      execute: async () => ({
        status: "success",
        message: "Executed by custom strategy",
      }),
    };

    const runner = new TaskRunner({});
    runner.setExecutionStrategy(customStrategy);

    const steps: TaskStep<unknown>[] = [
      {
        name: "A",
        run: async () => ({ status: "failure" }), // Should be ignored by custom strategy
      },
    ];

    const results = await runner.execute(steps);
    expect(results.get("A")?.message).toBe("Executed by custom strategy");
  });
});
