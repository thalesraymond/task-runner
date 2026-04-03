import { describe, it, expect } from "vitest";
import { TaskRunner } from "../src/TaskRunner.js";
import { MemoryCacheProvider } from "../src/utils/MemoryCacheProvider.js";
import { TaskStep } from "../src/TaskStep.js";

describe("TaskRunner Caching Integration", () => {
  it("should cache task execution and skip on subsequent runs", async () => {
    interface TestContext {
      runCount: number;
      restoredValue?: string;
    }

    const context: TestContext = { runCount: 0 };
    const runner = new TaskRunner<TestContext>(context);
    const cacheProvider = new MemoryCacheProvider();

    runner.setCacheProvider(cacheProvider);

    const task: TaskStep<TestContext> = {
      name: "cached-task",
      cache: {
        key: () => "my-static-key",
        restore: (ctx, result) => {
          ctx.restoredValue = result.data as string;
        }
      },
      run: async (ctx) => {
        ctx.runCount++;
        return { status: "success", data: "computation-result" };
      }
    };

    // First run - cache miss
    const result1 = await runner.execute([task]);
    expect(result1.get("cached-task")?.status).toBe("success");
    expect(context.runCount).toBe(1);

    // Second run - cache hit
    const result2 = await runner.execute([task]);
    expect(result2.get("cached-task")?.status).toBe("skipped"); // Using skipped as requested
    expect(context.runCount).toBe(1); // Run count shouldn't increase
    expect(context.restoredValue).toBe("computation-result"); // Side effects should be restored
  });
});
