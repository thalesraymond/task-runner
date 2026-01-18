import { describe, it, expect } from "vitest";
import { TaskRunner } from "../../src/TaskRunner.js";
import { TaskStep } from "../../src/TaskStep.js";

// Scenario 4 & 9 & 13 Context
interface SharedContext {
    data: Record<string, number>;
    logs: string[];
    sideEffectFile?: string;
}

describe("Integration: Context and State", () => {

    it("Scenario 4: Shared context mutation (A writes, B reads)", async () => {
        const context: SharedContext = { data: {}, logs: [] };
        const runner = new TaskRunner(context);

        const steps: TaskStep<SharedContext>[] = [
            {
                name: "Writer",
                run: async (ctx) => {
                    ctx.data["key"] = 42;
                    return { status: "success" };
                }
            },
            {
                name: "Reader",
                dependencies: ["Writer"],
                run: async (ctx) => {
                    if (ctx.data["key"] !== 42) {
                        return { status: "failure", error: "Context not mutated correctly" };
                    }
                    ctx.logs.push("Read 42");
                    return { status: "success" };
                }
            }
        ];

        const results = await runner.execute(steps);

        expect(results.get("Writer")?.status).toBe("success");
        expect(results.get("Reader")?.status).toBe("success");
        expect(context.data["key"]).toBe(42);
        expect(context.logs).toContain("Read 42");
    });

    it("Scenario 9: Dynamic context validation", async () => {
        // Task can validate context before proceeding
        const context: SharedContext = { data: { "init": 100 }, logs: [] };
        const runner = new TaskRunner(context);

        const steps: TaskStep<SharedContext>[] = [
            {
                name: "Validator",
                run: async (ctx) => {
                    if (!ctx.data["init"]) {
                         return { status: "failure", error: "Missing init data" };
                    }
                    if (ctx.data["init"] < 50) {
                        return { status: "failure", error: "Init data too small" };
                    }
                    return { status: "success" };
                }
            },
            {
                name: "Processor",
                dependencies: ["Validator"],
                run: async (ctx) => {
                    ctx.data["processed"] = ctx.data["init"] * 2;
                    return { status: "success" };
                }
            }
        ];

        const results = await runner.execute(steps);
        expect(results.get("Validator")?.status).toBe("success");
        expect(results.get("Processor")?.status).toBe("success");
        expect(context.data["processed"]).toBe(200);
    });

    it("Scenario 13: Tasks with side-effects", async () => {
        // We simulate a side effect (e.g. writing to a mock 'file' system in context)
        const context: SharedContext = { data: {}, logs: [] };
        const runner = new TaskRunner(context);

        const steps: TaskStep<SharedContext>[] = [
            {
                name: "IO-Task",
                run: async (ctx) => {
                    // Simulate async I/O
                    await new Promise(r => setTimeout(r, 10));
                    ctx.sideEffectFile = "/tmp/test-output.txt";
                    return { status: "success" };
                }
            },
            {
                name: "Verify-IO",
                dependencies: ["IO-Task"],
                run: async (ctx) => {
                    if (ctx.sideEffectFile !== "/tmp/test-output.txt") {
                        return { status: "failure", error: "File not created" };
                    }
                    return { status: "success" };
                }
            }
        ];

        const results = await runner.execute(steps);
        expect(results.get("IO-Task")?.status).toBe("success");
        expect(results.get("Verify-IO")?.status).toBe("success");
        expect(context.sideEffectFile).toBe("/tmp/test-output.txt");
    });
});
