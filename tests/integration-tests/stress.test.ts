import { describe, it, expect } from "vitest";
import { TaskRunner } from "../../src/TaskRunner.js";
import { TaskStep } from "../../src/TaskStep.js";

describe("Integration: Stress Tests", () => {

    it("Scenario 5: Large graph execution (e.g., 20+ nodes)", async () => {
        // Create a deep and wide graph.
        // A -> [B1...B5] -> [C1...C5] -> D
        // Total: 1 (A) + 5 (B) + 5 (C) + 1 (D) = 12 nodes.
        // Let's make it bigger. 20 layers of single nodes? Or pyramid?

        // Let's do a grid: 5 layers of 5 nodes each.
        // L0: [N0_0, ... N0_4]
        // L1: [N1_0, ... N1_4] where N1_x depends on all N0_y

        const layers = 5;
        const width = 5;
        const steps: TaskStep<unknown>[] = [];

        for (let l = 0; l < layers; l++) {
            for (let w = 0; w < width; w++) {
                const name = `L${l}_W${w}`;
                let deps: string[] | undefined = undefined;
                if (l > 0) {
                    deps = [];
                    // Depends on all nodes from previous layer
                    for (let pw = 0; pw < width; pw++) {
                        deps.push(`L${l-1}_W${pw}`);
                    }
                }
                steps.push({
                    name,
                    dependencies: deps,
                    run: async () => ({ status: "success" })
                });
            }
        }

        const totalTasks = layers * width; // 25
        expect(steps.length).toBe(totalTasks);

        const runner = new TaskRunner({});
        const results = await runner.execute(steps);

        expect(results.size).toBe(totalTasks);
        results.forEach(res => {
            expect(res.status).toBe("success");
        });
    });
});
