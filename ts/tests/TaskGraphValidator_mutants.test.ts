import { describe, it, expect, vi } from "vitest";
import { TaskGraphValidator } from "../src/TaskGraphValidator.js";
import { ERROR_CYCLE, ERROR_DUPLICATE_TASK } from "../src/contracts/ErrorTypes.js";
import { TaskGraph } from "../src/TaskGraph.js";

describe("TaskGraphValidator Mutants", () => {
  it("should not check for cycles if there are other errors besides missing dependencies", () => {
    const validator = new TaskGraphValidator();

    const graph: TaskGraph = {
      tasks: [
        { id: "A", dependencies: ["A"] }, // cycle
        { id: "A", dependencies: [] }    // duplicate
      ]
    };

    const result = validator.validate(graph);

    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: ERROR_DUPLICATE_TASK }),
        expect.objectContaining({ type: ERROR_CYCLE })
      ])
    );
  });

  it("should include taskId in details for duplicate task error", () => {
      const validator = new TaskGraphValidator();
      const graph: TaskGraph = {
          tasks: [
              { id: "A", dependencies: [] },
              { id: "A", dependencies: [] }
          ]
      };
      const result = validator.validate(graph);
      expect(result.errors[0].details).toEqual({ taskId: "A" });
  });

  it("should include cyclePath in details for cycle error", () => {
      const validator = new TaskGraphValidator();
      const graph: TaskGraph = {
          tasks: [
              { id: "A", dependencies: ["B"] },
              { id: "B", dependencies: ["A"] }
          ]
      };
      const result = validator.validate(graph);
      expect(result.errors[0].details).toEqual({ cyclePath: ["A", "B", "A"] });
  });

  it("should properly slice path for cyclePath", () => {
      const validator = new TaskGraphValidator();
      const graph: TaskGraph = {
          tasks: [
              { id: "A", dependencies: ["B"] },
              { id: "B", dependencies: ["C"] },
              { id: "C", dependencies: ["B"] }
          ]
      };
      const result = validator.validate(graph);
      expect((result.errors[0].details as { cyclePath: string[] }).cyclePath).toEqual(["B", "C", "B"]);
  });

  it("should skip already visited tasks in cycle detection without executing the block", () => {
      const validator = new TaskGraphValidator();
      const graph: TaskGraph = {
          tasks: [
              { id: "A", dependencies: ["B"] },
              { id: "B", dependencies: [] },
              { id: "C", dependencies: [] }
          ]
      };

      // @ts-expect-error bypass private access
      const detectCycleSpy = vi.spyOn(validator, "detectCycle");

      const result = validator.validate(graph);

      expect(result.isValid).toBe(true);
      // "A" visits "B". Then the outer loop encounters "B", it should hit the continue block
      // and NOT call detectCycle again. "C" is then visited and calls detectCycle.
      // So detectCycle should be called for "A" and "C" only.
      expect(detectCycleSpy).toHaveBeenCalledTimes(2);
      expect(detectCycleSpy).not.toHaveBeenCalledWith(
        "B", expect.anything(), expect.anything(), expect.anything(), expect.anything()
      );
  });

  it("should initialize path as empty array instead of mutated value", () => {
      const validator = new TaskGraphValidator();
      const graph: TaskGraph = {
          tasks: [
              { id: "A", dependencies: ["A"] } // cycle to itself
          ]
      };
      const result = validator.validate(graph);
      // If path was initialized as ["Stryker was here"], cyclePath would be ["Stryker was here", "A", "A"]
      // or similar instead of ["A", "A"]
      expect((result.errors[0].details as { cyclePath: string[] }).cyclePath).toEqual(["A", "A"]);
      // Also check the error message starts properly
      expect(result.errors[0].message).toBe("Cycle detected: A -> A");
  });
});
