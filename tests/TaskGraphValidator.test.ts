import { describe, it, expect } from "vitest";
import { TaskGraphValidator } from "../src/TaskGraphValidator.js";
import { TaskGraph } from "../src/validation-contracts.js";

describe("TaskGraphValidator", () => {
    it("should be instantiated", () => {
        const validator = new TaskGraphValidator();
        expect(validator).toBeDefined();
    });

    it("should return valid result for empty graph", () => {
        const validator = new TaskGraphValidator();
        const graph: TaskGraph = { tasks: [] };
        const result = validator.validate(graph);
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
    });

    it("should detect duplicate tasks", () => {
        const validator = new TaskGraphValidator();
        const graph: TaskGraph = {
            tasks: [
                { id: "task1", dependencies: [] },
                { id: "task1", dependencies: [] }
            ]
        };
        const result = validator.validate(graph);
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].type).toBe("duplicate_task");
        expect(result.errors[0].message).toContain("task1");
    });

    it("should detect missing dependencies", () => {
        const validator = new TaskGraphValidator();
        const graph: TaskGraph = {
            tasks: [
                { id: "task1", dependencies: ["task2"] }
            ]
        };
        const result = validator.validate(graph);
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].type).toBe("missing_dependency");
        expect(result.errors[0].message).toContain("task2");
    });

    it("should detect cycles", () => {
        const validator = new TaskGraphValidator();
        const graph: TaskGraph = {
            tasks: [
                { id: "task1", dependencies: ["task2"] },
                { id: "task2", dependencies: ["task1"] }
            ]
        };
        const result = validator.validate(graph);
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].type).toBe("cycle");
        expect(result.errors[0].message).toContain("Cycle detected");
    });

    it("should return valid for a correct graph", () => {
        const validator = new TaskGraphValidator();
        const graph: TaskGraph = {
            tasks: [
                { id: "task1", dependencies: [] },
                { id: "task2", dependencies: ["task1"] }
            ]
        };
        const result = validator.validate(graph);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    it("should not detect cycles if missing dependencies are present", () => {
        // This test ensures that we skip cycle detection if we have missing deps
        // to avoid chasing ghosts.
        const validator = new TaskGraphValidator();
        const graph: TaskGraph = {
            tasks: [
                { id: "task1", dependencies: ["missing"] },
                // technically a self cycle on task1 if we ignored missing? No, that's not right.
                // Let's make a cycle AND a missing dependency
                { id: "A", dependencies: ["B"] },
                { id: "B", dependencies: ["A"] },
                { id: "C", dependencies: ["missing"] }
            ]
        };
        const result = validator.validate(graph);
        expect(result.isValid).toBe(false);
        // Should only have missing dependency error, cycle detection should be skipped
        const hasMissing = result.errors.some(e => e.type === "missing_dependency");
        const hasCycle = result.errors.some(e => e.type === "cycle");
        expect(hasMissing).toBe(true);
        expect(hasCycle).toBe(false);
    });

    it("should detect more complex cycles", () => {
         const validator = new TaskGraphValidator();
        const graph: TaskGraph = {
            tasks: [
                { id: "A", dependencies: ["B"] },
                { id: "B", dependencies: ["C"] },
                { id: "C", dependencies: ["A"] }
            ]
        };
        const result = validator.validate(graph);
        expect(result.isValid).toBe(false);
        expect(result.errors[0].type).toBe("cycle");
        expect(result.errors[0].message).toContain("A -> B -> C -> A");
    });

    it("should handle cycle detection with no cycles but shared dependencies", () => {
        const validator = new TaskGraphValidator();
        const graph: TaskGraph = {
            tasks: [
                { id: "A", dependencies: [] },
                { id: "B", dependencies: ["A"] },
                { id: "C", dependencies: ["A"] },
                { id: "D", dependencies: ["B", "C"] }
            ]
        };
        const result = validator.validate(graph);
        expect(result.isValid).toBe(true);
    });
});
