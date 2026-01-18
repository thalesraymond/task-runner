import { describe, it, expect, vi } from "vitest";
import { TaskRunner } from "../src/TaskRunner.js";
import { TaskStep } from "../src/TaskStep.js";

describe("TaskRunner Events", () => {
  it("should fire all lifecycle events in a successful run", async () => {
    const steps: TaskStep<unknown>[] = [
      {
        name: "A",
        run: async () => ({ status: "success" }),
      },
      {
        name: "B",
        dependencies: ["A"],
        run: async () => ({ status: "success" }),
      },
    ];

    const runner = new TaskRunner({});
    const events: string[] = [];

    runner.on("workflowStart", () => events.push("workflowStart"));
    runner.on("taskStart", ({ step }: { step: TaskStep<unknown> }) =>
      events.push(`taskStart:${step.name}`)
    );
    runner.on("taskEnd", ({ step }: { step: TaskStep<unknown> }) =>
      events.push(`taskEnd:${step.name}`)
    );
    runner.on("workflowEnd", () => events.push("workflowEnd"));

    await runner.execute(steps);

    expect(events).toContain("workflowStart");
    expect(events).toContain("taskStart:A");
    expect(events).toContain("taskEnd:A");
    expect(events).toContain("taskStart:B");
    expect(events).toContain("taskEnd:B");
    expect(events).toContain("workflowEnd");

    // Order check (partial)
    expect(events[0]).toBe("workflowStart");
    expect(events[events.length - 1]).toBe("workflowEnd");
  });

  it("should fire taskSkipped event when dependency fails", async () => {
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
    const onSkipped = vi.fn();

    runner.on("taskSkipped", onSkipped);

    await runner.execute(steps);

    expect(onSkipped).toHaveBeenCalledTimes(1);
    expect(onSkipped).toHaveBeenCalledWith(
      expect.objectContaining({
        step: steps[1],
        result: expect.objectContaining({ status: "skipped" }),
      })
    );
  });

  it("should not crash if a listener throws an error", async () => {
    const steps: TaskStep<unknown>[] = [
      {
        name: "A",
        run: async () => ({ status: "success" }),
      },
    ];

    const runner = new TaskRunner({});
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(
      () => {}
    );

    runner.on("taskStart", () => {
      throw new Error("Listener crash");
    });
    const onTaskEnd = vi.fn();
    runner.on("taskEnd", onTaskEnd);

    await runner.execute(steps);

    expect(onTaskEnd).toHaveBeenCalled(); // Should still run other listeners/logic
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Error in event listener"),
      expect.any(Error)
    );
    consoleErrorSpy.mockRestore();
  });

  it("should fire workflow events even for empty step list", async () => {
    const runner = new TaskRunner({});
    const onStart = vi.fn();
    const onEnd = vi.fn();

    runner.on("workflowStart", onStart);
    runner.on("workflowEnd", onEnd);

    await runner.execute([]);

    expect(onStart).toHaveBeenCalled();
    expect(onEnd).toHaveBeenCalled();
  });

  it("should handle unsubscribe correctly", async () => {
    const steps: TaskStep<unknown>[] = [
      { name: "A", run: async () => ({ status: "success" }) },
    ];
    const runner = new TaskRunner({});
    const onStart = vi.fn();

    runner.on("taskStart", onStart);
    runner.off("taskStart", onStart);

    await runner.execute(steps);

    expect(onStart).not.toHaveBeenCalled();
  });
});
