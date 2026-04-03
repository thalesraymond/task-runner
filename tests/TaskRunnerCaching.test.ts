import { describe, it, expect } from "vitest";
import { TaskRunnerBuilder } from "../src/TaskRunnerBuilder.js";
import { TaskStep } from "../src/TaskStep.js";

describe("TaskRunner Caching Integration", () => {
  it("should bypass execution and restore context on cache hit", async () => {
    let executionCount = 0;

    interface Context {
      counter: number;
    }

    const step1: TaskStep<Context> = {
      name: "step1",
      cache: {
        key: () => "step1-key",
        restore: (ctx, res) => {
          ctx.counter = (res.data as { newCounter: number }).newCounter;
        }
      },
      run: async (ctx) => {
        executionCount++;
        ctx.counter += 10;
        return { status: "success", data: { newCounter: ctx.counter } };
      }
    };

    const context1: Context = { counter: 0 };
    const runner1 = new TaskRunnerBuilder(context1).withCache().build();
    const result1 = await runner1.execute([step1]);

    expect(executionCount).toBe(1);
    expect(context1.counter).toBe(10);
    expect(result1.get("step1")?.status).toBe("success");

  });

  it("should use shared cache provider across runners if provided", async () => {
    let executionCount = 0;

    interface Context {
      counter: number;
    }

    const step1: TaskStep<Context> = {
      name: "step1",
      cache: {
        key: () => "step1-key",
        restore: (ctx, res) => {
          ctx.counter = (res.data as { newCounter: number }).newCounter;
        }
      },
      run: async (ctx) => {
        executionCount++;
        ctx.counter += 10;
        return { status: "success", data: { newCounter: ctx.counter } };
      }
    };

    const { MemoryCacheProvider } = await import("../src/utils/MemoryCacheProvider.js");
    const sharedCache = new MemoryCacheProvider();

    const context1: Context = { counter: 0 };
    const runner1 = new TaskRunnerBuilder(context1).withCache(sharedCache).build();
    await runner1.execute([step1]);

    expect(executionCount).toBe(1);
    expect(context1.counter).toBe(10);

    const context2: Context = { counter: 0 };
    const runner2 = new TaskRunnerBuilder(context2).withCache(sharedCache).build();
    const result2 = await runner2.execute([step1]);

    expect(executionCount).toBe(1); // Did not execute again
    expect(context2.counter).toBe(10); // Restored!
    expect(result2.get("step1")?.status).toBe("skipped"); // Returned cached
  });
});
