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
        "Circular dependency or missing dependency detected. Unable to run tasks: A, B",
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
        "Circular dependency or missing dependency detected. Unable to run tasks: A",
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
      /Circular dependency or missing dependency detected/
    );
  });

  it("should limit concurrent tasks to N", async () => {
    const activeTasks = new Set<string>();
    let maxConcurrent = 0;
    const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

    const steps: TaskStep<unknown>[] = [
      {
        name: "A",
        run: async () => {
          activeTasks.add("A");
          maxConcurrent = Math.max(maxConcurrent, activeTasks.size);
          await delay(50);
          activeTasks.delete("A");
          return { status: "success" };
        },
      },
      {
        name: "B",
        run: async () => {
          activeTasks.add("B");
          maxConcurrent = Math.max(maxConcurrent, activeTasks.size);
          await delay(50);
          activeTasks.delete("B");
          return { status: "success" };
        },
      },
      {
        name: "C",
        run: async () => {
          activeTasks.add("C");
          maxConcurrent = Math.max(maxConcurrent, activeTasks.size);
          await delay(50);
          activeTasks.delete("C");
          return { status: "success" };
        },
      },
      {
        name: "D",
        run: async () => {
          activeTasks.add("D");
          maxConcurrent = Math.max(maxConcurrent, activeTasks.size);
          await delay(50);
          activeTasks.delete("D");
          return { status: "success" };
        },
      },
    ];

    const runner = new TaskRunner({});
    await runner.execute(steps, { concurrency: 2 });

    expect(maxConcurrent).toBeLessThanOrEqual(2);
    expect(maxConcurrent).toBeGreaterThan(0); // Sanity check
  });

  it("should queue tasks when concurrency limit is reached", async () => {
    const events: string[] = [];
    const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

    const steps: TaskStep<unknown>[] = [
      {
        name: "A",
        run: async () => {
          events.push("A start");
          await delay(50);
          events.push("A end");
          return { status: "success" };
        },
      },
      {
        name: "B",
        run: async () => {
          events.push("B start");
          await delay(50);
          events.push("B end");
          return { status: "success" };
        },
      },
      {
        name: "C",
        run: async () => {
          events.push("C start");
          await delay(50);
          events.push("C end");
          return { status: "success" };
        },
      },
    ];

    const runner = new TaskRunner({});
    // Concurrency 1 means they run sequentially: A, B, C (or some order)
    // But importantly, B and C wait in queue while A runs.
    await runner.execute(steps, { concurrency: 1 });

    // Check that we never have interleaving starts
    // Good pattern: Start -> End -> Start -> End
    // Bad pattern: Start -> Start ...

    let runningCount = 0;
    let maxRunning = 0;

    for (const event of events) {
      if (event.includes("start")) runningCount++;
      if (event.includes("end")) runningCount--;
      maxRunning = Math.max(maxRunning, runningCount);
    }

    expect(maxRunning).toBe(1);
    expect(events).toHaveLength(6);
  });

  it("should handle concurrency: 0 as unlimited", async () => {
    const activeTasks = new Set<string>();
    let maxConcurrent = 0;
    const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

    const steps = [1, 2, 3, 4, 5].map((i) => ({
      name: `T${i}`,
      run: async () => {
        activeTasks.add(`T${i}`);
        maxConcurrent = Math.max(maxConcurrent, activeTasks.size);
        await delay(50);
        activeTasks.delete(`T${i}`);
        return { status: "success" };
      },
    }));

    const runner = new TaskRunner({});
    await runner.execute(steps as TaskStep<unknown>[], { concurrency: 0 });

    // Since we wait 50ms inside each, and we have 5 tasks.
    // If sequential: 250ms.
    // If parallel: ~50ms.
    // If unlimited, maxConcurrent should be 5 (or close to it, depending on event loop).
    // It should definitely be > 1.
    expect(maxConcurrent).toBeGreaterThan(1);
    expect(maxConcurrent).toBe(5);
  });

  it("should handle concurrency: Infinity as unlimited", async () => {
    const activeTasks = new Set<string>();
    let maxConcurrent = 0;
    const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

    const steps = [1, 2, 3, 4, 5].map((i) => ({
      name: `T${i}`,
      run: async () => {
        activeTasks.add(`T${i}`);
        maxConcurrent = Math.max(maxConcurrent, activeTasks.size);
        await delay(50);
        activeTasks.delete(`T${i}`);
        return { status: "success" };
      },
    }));

    const runner = new TaskRunner({});
    await runner.execute(steps as TaskStep<unknown>[], { concurrency: Infinity });

    expect(maxConcurrent).toBeGreaterThan(1);
    expect(maxConcurrent).toBe(5);
  });
});
