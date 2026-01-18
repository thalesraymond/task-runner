
import { describe, it, expect } from "vitest";
import { TaskRunner } from "../../src/TaskRunner.js";
import { TaskStep } from "../../src/TaskStep.js";

// Helper to create a task that runs for a duration
const createDelayedTask = (
  name: string,
  delay: number,
  timestamps: Map<string, { start: number; end: number }>
): TaskStep<any> => ({
  name,
  run: async () => {
    timestamps.set(name, { start: Date.now(), end: 0 });
    await new Promise((resolve) => setTimeout(resolve, delay));
    const entry = timestamps.get(name);
    if (entry) {
        entry.end = Date.now();
    }
    return { status: "success" };
  },
});

describe("Concurrency Control", () => {
  it("should run independent tasks sequentially when concurrency is 1", async () => {
    const timestamps = new Map<string, { start: number; end: number }>();
    const runner = new TaskRunner({});

    // Create 3 independent tasks (no dependencies)
    // By default they would run in parallel
    const steps: TaskStep<any>[] = [
      createDelayedTask("task1", 50, timestamps),
      createDelayedTask("task2", 50, timestamps),
      createDelayedTask("task3", 50, timestamps),
    ];

    await runner.execute(steps, { concurrency: 1 });

    const t1 = timestamps.get("task1")!;
    const t2 = timestamps.get("task2")!;
    const t3 = timestamps.get("task3")!;

    // Sort by start time to handle non-deterministic order of execution
    const sortedTasks = [t1, t2, t3].sort((a, b) => a.start - b.start);

    // Verify sequential execution:
    // Task 2 start should be >= Task 1 end
    // Task 3 start should be >= Task 2 end
    expect(sortedTasks[1].start).toBeGreaterThanOrEqual(sortedTasks[0].end);
    expect(sortedTasks[2].start).toBeGreaterThanOrEqual(sortedTasks[1].end);
  });

  it("should run tasks in parallel when concurrency is unlimited (undefined)", async () => {
    const timestamps = new Map<string, { start: number; end: number }>();
    const runner = new TaskRunner({});

    const steps: TaskStep<any>[] = [
      createDelayedTask("p1", 50, timestamps),
      createDelayedTask("p2", 50, timestamps),
    ];

    await runner.execute(steps); // No concurrency limit

    const p1 = timestamps.get("p1")!;
    const p2 = timestamps.get("p2")!;

    // Should overlap
    // P2 start should be less than P1 end
    // P1 start should be less than P2 end
    expect(p2.start).toBeLessThan(p1.end);
    expect(p1.start).toBeLessThan(p2.end);
  });
});
