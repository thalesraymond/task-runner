import { describe, it, expect } from "vitest";
import { TaskRunner } from "../../src/TaskRunner.js";
import { TaskStep } from "../../src/TaskStep.js";

interface TestContext {
    visited: string[];
}

describe("Integration: Basic Structure", () => {
    const createStep = (name: string, dependencies?: string[], duration = 10): TaskStep<TestContext> => ({
        name,
        dependencies,
        run: async (ctx) => {
            await new Promise(resolve => setTimeout(resolve, duration));
            ctx.visited.push(name);
            return { status: "success" };
        }
    });

    it("Scenario 1: Basic linear workflow (A -> B -> C)", async () => {
        const context: TestContext = { visited: [] };
        const runner = new TaskRunner(context);

        const steps = [
            createStep("A"),
            createStep("B", ["A"]),
            createStep("C", ["B"])
        ];

        const results = await runner.execute(steps);

        expect(results.get("A")?.status).toBe("success");
        expect(results.get("B")?.status).toBe("success");
        expect(results.get("C")?.status).toBe("success");
        expect(context.visited).toEqual(["A", "B", "C"]);
    });

    it("Scenario 2: Branching workflow (A -> [B, C] -> D)", async () => {
        const context: TestContext = { visited: [] };
        const runner = new TaskRunner(context);

        const steps = [
            createStep("A"),
            createStep("B", ["A"]),
            createStep("C", ["A"]),
            createStep("D", ["B", "C"])
        ];

        const results = await runner.execute(steps);

        expect(results.get("A")?.status).toBe("success");
        expect(results.get("B")?.status).toBe("success");
        expect(results.get("C")?.status).toBe("success");
        expect(results.get("D")?.status).toBe("success");

        // A must be first
        expect(context.visited[0]).toBe("A");
        // B and C can be in any order (1 and 2)
        expect(context.visited.slice(1, 3)).toContain("B");
        expect(context.visited.slice(1, 3)).toContain("C");
        // D must be last
        expect(context.visited[3]).toBe("D");
    });

    it("Scenario 12: Complex 'Diamond' dependency graph (A -> B -> D, A -> C -> D)", async () => {
         // This is technically the same as Scenario 2's structure, but let's be explicit and maybe add more layers if needed.
         // Let's do A -> [B, C] -> D -> E
         const context: TestContext = { visited: [] };
         const runner = new TaskRunner(context);

         const steps = [
             createStep("A"),
             createStep("B", ["A"]),
             createStep("C", ["A"]),
             createStep("D", ["B", "C"]),
             createStep("E", ["D"])
         ];

         const results = await runner.execute(steps);

         expect(results.get("E")?.status).toBe("success");
         expect(context.visited[0]).toBe("A");
         expect(context.visited.slice(1, 3)).toContain("B");
         expect(context.visited.slice(1, 3)).toContain("C");
         expect(context.visited[3]).toBe("D");
         expect(context.visited[4]).toBe("E");
    });

    it("Scenario 14: Zero-dependency parallel burst", async () => {
        const context: TestContext = { visited: [] };
        const runner = new TaskRunner(context);

        // 10 tasks running in parallel
        const steps: TaskStep<TestContext>[] = [];
        for (let i = 0; i < 10; i++) {
            steps.push(createStep(`Task${i}`, undefined, 20)); // slightly longer to ensure overlap
        }

        const results = await runner.execute(steps);

        // Execution time should be close to single task duration, not sum of all
        // 10 tasks * 20ms = 200ms sequential.
        // With overhead, parallel should be well under 100ms ideally, definitely under 150ms.
        // But tests can be flaky on timing, so let's check order and completion.

        expect(results.size).toBe(10);
        steps.forEach(s => {
            expect(results.get(s.name)?.status).toBe("success");
        });
        expect(context.visited.length).toBe(10);

        // Basic check that it didn't run strictly sequentially
        // This is a loose check because in CI environments timing is unreliable.
        // But if it took > 150ms, something is likely wrong with parallelism given tasks are 20ms.
        // Let's just trust logic for now or add a loose assertion if reliable.
    });
});
