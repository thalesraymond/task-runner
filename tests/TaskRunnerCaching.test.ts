import { describe, it, expect, vi } from "vitest";
import { TaskRunnerBuilder } from "../src/TaskRunnerBuilder.js";
import { TaskStep } from "../src/TaskStep.js";
import { MemoryCacheProvider } from "../src/utils/MemoryCacheProvider.js";

interface TestContext {
  executionCount: number;
  restoredData?: string;
}

describe("TaskRunner Caching Integration", () => {
  it("should cache task execution and avoid re-execution on subsequent runs", async () => {
    const cacheProvider = new MemoryCacheProvider();

    // Create first runner, execution should happen
    const builder1 = new TaskRunnerBuilder<TestContext>({ executionCount: 0 });
    const runner1 = builder1.build();
    runner1.setCacheProvider(cacheProvider);

    const runSpy = vi.fn().mockImplementation(async (ctx: TestContext) => {
      ctx.executionCount++;
      return { status: "success", data: "expensive_computation_result" };
    });

    const step: TaskStep<TestContext> = {
      name: "expensiveTask",
      cache: {
        key: () => "static_key",
        restore: (ctx, result) => {
          ctx.restoredData = result.data as string;
        }
      },
      run: runSpy,
    };

    const results1 = await runner1.execute([step]);

    expect(runSpy).toHaveBeenCalledTimes(1);
    expect(results1.get("expensiveTask")?.status).toBe("success");

    // Create second runner with same cache, execution should be skipped
    const context2: TestContext = { executionCount: 0 };
    const builder2 = new TaskRunnerBuilder<TestContext>(context2);
    const runner2 = builder2.build();
    runner2.setCacheProvider(cacheProvider);

    // Reuse the exact same step config (runSpy will be checked)
    const results2 = await runner2.execute([step]);

    // runSpy should NOT be called again
    expect(runSpy).toHaveBeenCalledTimes(1);
    expect(results2.get("expensiveTask")?.status).toBe("skipped");
    expect(results2.get("expensiveTask")?.data).toBe("expensive_computation_result");

    // restore should have been called
    expect(context2.restoredData).toBe("expensive_computation_result");
    expect(context2.executionCount).toBe(0); // Task logic wasn't executed
  });
});
