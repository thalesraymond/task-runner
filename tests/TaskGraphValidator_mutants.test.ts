import { describe, it, expect } from "vitest";
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

  it("should include taskId in details for missing dependency error", () => {
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
});
