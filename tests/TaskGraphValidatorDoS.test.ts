import { describe, it, expect } from "vitest";
import { TaskGraphValidator } from "../src/TaskGraphValidator.js";
import { TaskGraph } from "../src/TaskGraph.js";

describe("TaskGraphValidator - Deep Recursion", () => {
    it("should handle deep graphs without stack overflow", () => {
        const validator = new TaskGraphValidator();
        const tasks = [];
        // Use a large depth to test robustness
        const depth = 20000;

        for (let i = 0; i < depth; i++) {
            tasks.push({
                id: `task-${i}`,
                dependencies: i > 0 ? [`task-${i - 1}`] : []
            });
        }

        const graph: TaskGraph = { tasks };

        const result = validator.validate(graph);
        expect(result.isValid).toBe(true);
    });
});
