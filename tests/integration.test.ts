import { describe, it, expect } from "vitest";
import { TaskRunner } from "../src/TaskRunner.js";
import { TaskStep } from "../src/TaskStep.js";

describe("TaskRunner Validation Integration", () => {
    it("should throw validation error with clear message for duplicate tasks", async () => {
        const steps: TaskStep<unknown>[] = [
            { name: "A", run: async () => ({ status: "success" }) },
            { name: "A", run: async () => ({ status: "success" }) }
        ];
        const runner = new TaskRunner({});

        expect(() => runner.load(steps)).toThrow(/Task graph validation failed: Duplicate task detected with ID: A/);
    });

    it("should throw validation error with clear message for missing dependencies", () => {
        const steps: TaskStep<unknown>[] = [
            { name: "A", dependencies: ["B"], run: async () => ({ status: "success" }) }
        ];
        const runner = new TaskRunner({});

        expect(() => runner.load(steps)).toThrow(/Task graph validation failed: Task 'A' depends on missing task 'B'/);
    });

    it("should throw validation error with clear message for cycles", () => {
        const steps: TaskStep<unknown>[] = [
            { name: "A", dependencies: ["B"], run: async () => ({ status: "success" }) },
            { name: "B", dependencies: ["A"], run: async () => ({ status: "success" }) }
        ];
        const runner = new TaskRunner({});

        expect(() => runner.load(steps)).toThrow(/Task graph validation failed: Cycle detected: A -> B -> A/);
    });
});
