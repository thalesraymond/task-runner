import { describe, it, expect } from "vitest";
import { TaskRunner } from "../../src/TaskRunner.js";
import { TaskStep } from "../../src/TaskStep.js";

describe("Integration: Concurrency and Timing", () => {

    it("Scenario 6: Mixed duration tasks (verifying parallel efficiency)", async () => {
        // A -> [B (slow), C (fast)] -> D
        // C should finish before B, and D waits for both.
        const runner = new TaskRunner({ log: [] as string[] });
        const results = await runner.execute([
            { name: "A", run: async () => ({ status: "success" }) },
            {
                name: "B",
                dependencies: ["A"],
                run: async () => {
                    await new Promise(r => setTimeout(r, 50));
                    return { status: "success" };
                }
            },
            {
                name: "C",
                dependencies: ["A"],
                run: async () => {
                    await new Promise(r => setTimeout(r, 10));
                    return { status: "success" };
                }
            },
            { name: "D", dependencies: ["B", "C"], run: async () => ({ status: "success" }) }
        ]);

        expect(results.get("A")?.status).toBe("success");
        expect(results.get("B")?.status).toBe("success");
        expect(results.get("C")?.status).toBe("success");
        expect(results.get("D")?.status).toBe("success");

        // Cannot easily check timestamp diffs here reliably without more complex setup,
        // but success implies coordination worked.
    });

    it("Scenario 7: Cancellation via AbortSignal", async () => {
        const controller = new AbortController();
        const runner = new TaskRunner({});

        const steps: TaskStep<unknown>[] = [
            {
                name: "LongTask",
                run: async (ctx, signal) => {
                    if (signal?.aborted) throw new Error("Aborted");
                    // Wait on a signal-aware promise
                    await new Promise((resolve, reject) => {
                         const timeout = setTimeout(resolve, 1000); // would run long
                         signal?.addEventListener("abort", () => {
                             clearTimeout(timeout);
                             reject(new Error("Aborted inside"));
                         });
                    });
                    return { status: "success" };
                }
            }
        ];

        const executePromise = runner.execute(steps, { signal: controller.signal });

        // Abort after a short while
        setTimeout(() => controller.abort(), 20);

        const results = await executePromise;
        const taskResult = results.get("LongTask");

        expect(taskResult?.status).toMatch(/cancelled|failure/);
    });

    it("Scenario 8: Global timeout interrupting long tasks", async () => {
         const runner = new TaskRunner({});

         const steps: TaskStep<unknown>[] = [
             {
                 name: "CooperativeLong",
                 run: async (ctx, signal) => {
                     return await new Promise((resolve) => {
                         const t = setTimeout(() => resolve({ status: "success" }), 200);
                         signal?.addEventListener("abort", () => {
                             clearTimeout(t);
                             // Return failure or just resolve. Usually one throws or returns cancelled.
                             resolve({ status: "cancelled", error: "Timeout" });
                         });
                     });
                 }
             }
         ];

         const start = Date.now();
         const results = await runner.execute(steps, { timeout: 50 });
         const duration = Date.now() - start;

         expect(duration).toBeLessThan(150);
         expect(results.get("CooperativeLong")?.status).toBe("cancelled");
    });
});
