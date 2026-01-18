
import { describe, it, expect, vi } from "vitest";
import { TaskRunner } from "../src/TaskRunner.js";
import { TaskStep } from "../src/TaskStep.js";

describe("TaskRunner Dry Run", () => {
  it("should not execute task run methods in dry run mode", async () => {
    const context = { value: 0 };
    const runner = new TaskRunner(context);

    const taskA: TaskStep<typeof context> = {
      name: "A",
      run: vi.fn(async (ctx) => {
        ctx.value += 1;
        return { status: "success" as const };
      }),
    };

    const taskB: TaskStep<typeof context> = {
      name: "B",
      dependencies: ["A"],
      run: vi.fn(async (ctx) => {
        ctx.value += 2;
        return { status: "success" as const };
      }),
    };

    const results = await runner.execute([taskA, taskB], { dryRun: true });

    expect(results.get("A")?.status).toBe("success");
    expect(results.get("B")?.status).toBe("success");
    expect(taskA.run).not.toHaveBeenCalled();
    expect(taskB.run).not.toHaveBeenCalled();
    expect(context.value).toBe(0);
  });

  it("should simulate execution order correctly", async () => {
     const context = {};
     const runner = new TaskRunner(context);

     const events: string[] = [];

     runner.on("taskStart", ({ step }) => {
        events.push(`${step.name}:start`);
     });
     runner.on("taskEnd", ({ step }) => {
        events.push(`${step.name}:end`);
     });

     const taskA: TaskStep<unknown> = { name: "A", run: async () => ({ status: "success" }) };
     const taskB: TaskStep<unknown> = { name: "B", dependencies: ["A"], run: async () => ({ status: "success" }) };

     await runner.execute([taskA, taskB], { dryRun: true });

     // Order should be A start, A end, B start, B end (or similar valid topological sort)
     expect(events).toEqual([
         "A:start", "A:end", "B:start", "B:end"
     ]);
  });

  it("should handle complex graphs in dry run", async () => {
      const context = {};
      const runner = new TaskRunner(context);

      const taskA: TaskStep<unknown> = { name: "A", run: async () => ({ status: "success" }) };
      const taskB: TaskStep<unknown> = { name: "B", dependencies: ["A"], run: async () => ({ status: "success" }) };
      const taskC: TaskStep<unknown> = { name: "C", dependencies: ["A"], run: async () => ({ status: "success" }) };
      const taskD: TaskStep<unknown> = { name: "D", dependencies: ["B", "C"], run: async () => ({ status: "success" }) };

      const results = await runner.execute([taskA, taskB, taskC, taskD], { dryRun: true });

      expect(results.size).toBe(4);
      results.forEach(r => expect(r.status).toBe("success"));
  });
});
