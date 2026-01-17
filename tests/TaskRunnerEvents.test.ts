import { describe, it, expect, vi } from "vitest";
import { TaskRunner } from "../src/TaskRunner";
import { TaskStep } from "../src/TaskStep";

describe("TaskRunner Events", () => {
  it("should emit lifecycle events", async () => {
    const steps: TaskStep<unknown>[] = [
      {
        name: "A",
        run: async () => ({ status: "success" }),
      },
    ];

    const runner = new TaskRunner({});
    const startSpy = vi.fn();
    const successSpy = vi.fn();
    const finishSpy = vi.fn();

    runner.on("task:start", startSpy);
    runner.on("task:success", successSpy);
    runner.on("task:finish", finishSpy);

    await runner.execute(steps);

    expect(startSpy).toHaveBeenCalledWith("A");
    expect(successSpy).toHaveBeenCalledWith(
      "A",
      expect.objectContaining({ status: "success" })
    );
    expect(finishSpy).toHaveBeenCalledWith(
      "A",
      expect.objectContaining({ status: "success" })
    );
  });

  it("should emit failure events", async () => {
    const steps: TaskStep<unknown>[] = [
      {
        name: "A",
        run: async () => ({ status: "failure", error: "oops" }),
      },
    ];

    const runner = new TaskRunner({});
    const failureSpy = vi.fn();

    runner.on("task:failure", failureSpy);

    await runner.execute(steps);

    expect(failureSpy).toHaveBeenCalledWith(
      "A",
      expect.objectContaining({ status: "failure", error: "oops" })
    );
  });

  it("should emit failure event on exception", async () => {
    const steps: TaskStep<unknown>[] = [
      {
        name: "A",
        run: async () => {
          throw new Error("crash");
        },
      },
    ];

    const runner = new TaskRunner({});
    const failureSpy = vi.fn();

    runner.on("task:failure", failureSpy);

    await runner.execute(steps);

    expect(failureSpy).toHaveBeenCalledWith(
      "A",
      expect.objectContaining({ status: "failure", error: "crash" })
    );
  });

  it("should emit skipped events", async () => {
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
    const skippedSpy = vi.fn();

    runner.on("task:skipped", skippedSpy);

    await runner.execute(steps);

    expect(skippedSpy).toHaveBeenCalledWith(
      "B",
      expect.objectContaining({ status: "skipped" })
    );
  });
});
