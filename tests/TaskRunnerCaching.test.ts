import { describe, it, expect, vi } from "vitest";
import { TaskRunner } from "../src/TaskRunner.js";
import { MemoryCacheProvider } from "../src/utils/MemoryCacheProvider.js";
import { TaskStep } from "../src/TaskStep.js";

describe("TaskRunner Caching Integration", () => {
  it("should cache successful task execution and restore context", async () => {
    type TestContext = {
      counter: number;
      restored: boolean;
    };

    const context: TestContext = { counter: 0, restored: false };
    const runner = new TaskRunner(context);
    const cacheProvider = new MemoryCacheProvider();
    runner.setCacheProvider(cacheProvider);

    const runMock = vi.fn().mockImplementation(async (ctx: TestContext) => {
      ctx.counter++;
      return { status: "success", data: "computed" };
    });

    const step: TaskStep<TestContext> = {
      name: "cached-task",
      run: runMock,
      cache: {
        key: () => "static-key",
        restore: (ctx) => {
          ctx.restored = true;
        },
      },
    };

    // First execution: cache miss
    const results1 = await runner.execute([step]);
    expect(results1.get("cached-task")?.status).toBe("success");
    expect(results1.get("cached-task")?.data).toBe("computed");
    expect(runMock).toHaveBeenCalledTimes(1);
    expect(context.counter).toBe(1);
    expect(context.restored).toBe(false);

    // Reset restored flag just in case
    context.restored = false;

    // Second execution: cache hit
    const results2 = await runner.execute([step]);
    expect(results2.get("cached-task")?.status).toBe("skipped"); // Or cached
    expect(results2.get("cached-task")?.data).toBe("computed");
    expect(runMock).toHaveBeenCalledTimes(1); // Not called again
    expect(context.counter).toBe(1); // Not incremented
    expect(context.restored).toBe(true); // Restored was called
  });

  it("should not cache if step has no cache configuration", async () => {
    type TestContext = { counter: number };
    const context: TestContext = { counter: 0 };
    const runner = new TaskRunner(context);
    const cacheProvider = new MemoryCacheProvider();
    runner.setCacheProvider(cacheProvider);

    const runMock = vi.fn().mockImplementation(async (ctx: TestContext) => {
      ctx.counter++;
      return { status: "success", data: "computed" };
    });

    const step: TaskStep<TestContext> = {
      name: "uncached-task",
      run: runMock,
    };

    await runner.execute([step]);
    await runner.execute([step]);

    expect(runMock).toHaveBeenCalledTimes(2);
    expect(context.counter).toBe(2);
  });
});
