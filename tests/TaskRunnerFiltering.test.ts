import { describe, it, expect, vi } from "vitest";
import { TaskRunner } from "../src/TaskRunner.js";
import { TaskStep } from "../src/TaskStep.js";
import { TaskGraphValidationError } from "../src/TaskGraphValidationError.js";

describe("TaskRunner Filtering Integration", () => {
  it("should execute only filtered tasks and their dependencies", async () => {
    const runner = new TaskRunner({});

    const taskA: TaskStep<unknown> = { name: "taskA", tags: ["core"], run: vi.fn().mockResolvedValue({ status: "success" }) };
    const taskB: TaskStep<unknown> = { name: "taskB", dependencies: ["taskA"], tags: ["feature"], run: vi.fn().mockResolvedValue({ status: "success" }) };
    const taskC: TaskStep<unknown> = { name: "taskC", dependencies: ["taskA"], tags: ["feature"], run: vi.fn().mockResolvedValue({ status: "success" }) };

    const steps = [taskA, taskB, taskC];

    const results = await runner.execute(steps, {
      filter: { includeNames: ["taskB"] }
    });

    expect(results.size).toBe(2);
    expect(results.has("taskA")).toBe(true);
    expect(results.has("taskB")).toBe(true);
    expect(results.has("taskC")).toBe(false);

    expect(taskA.run).toHaveBeenCalled();
    expect(taskB.run).toHaveBeenCalled();
    expect(taskC.run).not.toHaveBeenCalled();
  });

  it("should fail validation if a required dependency is explicitly excluded", async () => {
    const runner = new TaskRunner({});

    const taskA: TaskStep<unknown> = { name: "taskA", tags: ["core"], run: vi.fn().mockResolvedValue({ status: "success" }) };
    const taskB: TaskStep<unknown> = { name: "taskB", dependencies: ["taskA"], tags: ["feature"], run: vi.fn().mockResolvedValue({ status: "success" }) };

    const steps = [taskA, taskB];

    // taskB needs taskA, but taskA is excluded by tag
    await expect(runner.execute(steps, {
      filter: { includeNames: ["taskB"], excludeTags: ["core"] }
    })).rejects.toThrow(TaskGraphValidationError);
  });
});
