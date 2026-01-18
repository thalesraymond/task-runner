import { describe, it, expect, vi } from "vitest";
import { TaskRunner } from "../../src/TaskRunner.js";
import { TaskStep } from "../../src/TaskStep.js";

describe("Integration: Dry Run", () => {
  it("should execute successfully without side effects", async () => {
    const sideEffect = vi.fn();
    const runner = new TaskRunner({});

    const steps: TaskStep<unknown>[] = [
      {
        name: "A",
        run: async () => {
          sideEffect();
          return { status: "success" };
        },
      },
      {
        name: "B",
        dependencies: ["A"],
        run: async () => {
          sideEffect();
          return { status: "success" };
        },
      },
    ];

    const results = await runner.execute(steps, { dryRun: true });

    expect(results.get("A")?.status).toBe("success");
    expect(results.get("B")?.status).toBe("success");
    expect(results.get("A")?.message).toBe("Dry run: simulated success");
    expect(results.get("B")?.message).toBe("Dry run: simulated success");
    expect(sideEffect).not.toHaveBeenCalled();
  });

  it("should respect dependencies (topological order is maintained even in dry run)", async () => {
    // In dry run, things might run "instantly", but the WorkflowExecutor should still process them in order
    // because B depends on A, B cannot start until A is "completed" (which is instant in dry run).
    // We can't easily verify timing in dry run since it's all sync/microtask based essentially,
    // but we can verify that everything "ran" and got the correct status.

    const runner = new TaskRunner({});
    const steps: TaskStep<unknown>[] = [
      { name: "A", run: async () => ({ status: "failure" }) }, // Even if it would fail, dry run says success
      {
        name: "B",
        dependencies: ["A"],
        run: async () => ({ status: "success" }),
      },
    ];

    const results = await runner.execute(steps, { dryRun: true });

    expect(results.get("A")?.status).toBe("success");
    // If A was a failure, B would be skipped. But DryRun returns success for A, so B should run (dry run) and succeed.
    expect(results.get("B")?.status).toBe("success");
  });
});
