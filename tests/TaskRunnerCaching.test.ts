import { describe, it, expect, vi } from "vitest";
import { TaskRunner } from "../src/TaskRunner.js";
import { TaskStep } from "../src/TaskStep.js";
import { MemoryCacheProvider } from "../src/utils/MemoryCacheProvider.js";

describe("TaskRunner Caching Integration", () => {
  it("should cache successful tasks and skip execution on subsequent runs", async () => {
    const cacheProvider = new MemoryCacheProvider();
    const context = { counter: 0, restored: false };

    const runMock = vi.fn().mockImplementation(async (ctx: typeof context) => {
      ctx.counter++;
      return { status: "success", data: "computed" };
    });

    const step: TaskStep<typeof context> = {
      name: "cached_task",
      cache: {
        key: () => "my_integration_key",
        restore: (ctx) => {
          ctx.restored = true;
          ctx.counter = 999;
        },
      },
      run: runMock,
    };

    // First Run (Cache Miss)
    const runner1 = new TaskRunner(context);
    const results1 = await runner1.execute([step], { cacheProvider });

    const result1 = results1.get("cached_task");
    expect(result1?.status).toBe("success");
    expect(result1?.data).toBe("computed");
    expect(runMock).toHaveBeenCalledTimes(1);
    expect(context.counter).toBe(1);
    expect(context.restored).toBe(false);

    // Second Run (Cache Hit)
    const runner2 = new TaskRunner(context);
    const results2 = await runner2.execute([step], { cacheProvider });

    const result2 = results2.get("cached_task");
    expect(result2?.status).toBe("cached");
    expect(result2?.data).toBe("computed");
    expect(runMock).toHaveBeenCalledTimes(1); // Not called again
    expect(context.restored).toBe(true);
    expect(context.counter).toBe(999);
  });
});
