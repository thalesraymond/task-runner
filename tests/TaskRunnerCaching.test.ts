import { describe, it, expect } from "vitest";
import { TaskRunner } from "../src/TaskRunner.js";
import { TaskStep } from "../src/TaskStep.js";
import { MemoryCacheProvider } from "../src/utils/MemoryCacheProvider.js";

interface TestContext {
  executionCount: number;
  data: string[];
}

describe("TaskRunner Caching Integration", () => {
  it("should cache task outputs and restore context across runs", async () => {
    const context: TestContext = { executionCount: 0, data: [] };
    const runner = new TaskRunner(context);
    const cacheProvider = new MemoryCacheProvider();
    runner.setCacheProvider(cacheProvider);

    const step: TaskStep<TestContext> = {
      name: "expensiveTask",
      cache: {
        key: () => "expensive-task-key",
        restore: (ctx, res) => {
          if (res.data) {
            ctx.data.push(res.data as string);
          }
        },
      },
      run: async (ctx) => {
        ctx.executionCount++;
        ctx.data.push("run-data");
        return { status: "success", data: "run-data" };
      },
    };

    // First run (cache miss)
    const results1 = await runner.execute([step]);
    expect(results1.get("expensiveTask")?.status).toBe("success");
    expect(context.executionCount).toBe(1);
    expect(context.data).toEqual(["run-data"]);

    // Second run (cache hit)
    // Create new context to verify restore works correctly
    const context2: TestContext = { executionCount: 0, data: [] };
    const runner2 = new TaskRunner(context2);
    runner2.setCacheProvider(cacheProvider); // Reuse the same cache

    const results2 = await runner2.execute([step]);
    expect(results2.get("expensiveTask")?.status).toBe("skipped");
    expect(results2.get("expensiveTask")?.message).toBe("Task skipped (cached)");
    expect(results2.get("expensiveTask")?.data).toBe("run-data");

    // Context should not have been updated by the run method, but by restore
    expect(context2.executionCount).toBe(0);
    expect(context2.data).toEqual(["run-data"]);
  });

  it("should ignore cache during dry runs", async () => {
    const context: TestContext = { executionCount: 0, data: [] };
    const runner = new TaskRunner(context);
    const cacheProvider = new MemoryCacheProvider();

    // Seed cache
    cacheProvider.set("expensive-task-key", { status: "success", data: "cached-data" });
    runner.setCacheProvider(cacheProvider);

    const step: TaskStep<TestContext> = {
      name: "expensiveTask",
      cache: {
        key: () => "expensive-task-key",
      },
      run: async (ctx) => {
        ctx.executionCount++;
        return { status: "success" };
      },
    };

    const results = await runner.execute([step], { dryRun: true });

    // In a dry run, the status is typically success with a dry-run message,
    // and the execution strategy doesn't hit the cache strategy at all.
    expect(results.get("expensiveTask")?.status).toBe("success");
    expect(results.get("expensiveTask")?.message).toBe("Dry run: simulated success expensiveTask");
    // Should not have the cached data
    expect(results.get("expensiveTask")?.data).toBeUndefined();
    expect(context.executionCount).toBe(0);
  });
});
