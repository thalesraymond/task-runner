import { describe, it, expect, vi } from "vitest";
import { TaskRunner } from "../src/TaskRunner.js";
import { TaskStep } from "../src/TaskStep.js";

describe("TaskRunner dryRun", () => {
  it("should not execute task side effects in dryRun mode", async () => {
    const context = { value: 0 };
    const runner = new TaskRunner(context);

    const step1Run = vi.fn().mockImplementation(async (ctx) => {
      ctx.value += 1;
      return { status: "success" };
    });

    const steps: TaskStep<typeof context>[] = [
      {
        name: "step1",
        run: step1Run,
      },
    ];

    const results = await runner.execute(steps, { dryRun: true });

    expect(results.get("step1")?.status).toBe("success");
    expect(results.get("step1")?.message).toContain("dry run");
    expect(step1Run).not.toHaveBeenCalled();
    expect(context.value).toBe(0);
  });

  it("should emit events in dryRun mode", async () => {
    const context = {};
    const runner = new TaskRunner(context);
    const steps: TaskStep<typeof context>[] = [
      { name: "step1", run: async () => ({ status: "success" }) },
    ];

    const onStart = vi.fn();
    const onEnd = vi.fn();

    runner.on("taskStart", onStart);
    runner.on("taskEnd", onEnd);

    await runner.execute(steps, { dryRun: true });

    expect(onStart).toHaveBeenCalledWith(expect.objectContaining({ step: steps[0] }));
    expect(onEnd).toHaveBeenCalledWith(expect.objectContaining({ step: steps[0] }));
  });

  it("should respect dependencies in dryRun mode", async () => {
    const context = {};
    const runner = new TaskRunner(context);
    const order: string[] = [];

    const steps: TaskStep<typeof context>[] = [
      {
        name: "step2",
        dependencies: ["step1"],
        run: async () => ({ status: "success" }),
      },
      {
        name: "step1",
        run: async () => ({ status: "success" }),
      },
    ];

    runner.on("taskEnd", ({ step }) => {
      order.push(step.name);
    });

    await runner.execute(steps, { dryRun: true });

    expect(order).toEqual(["step1", "step2"]);
  });
});
