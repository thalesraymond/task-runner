import { describe, it, expect } from "vitest";
import { TaskGraphValidator } from "../src/TaskGraphValidator.js";
import { TaskGraph } from "../src/TaskGraph.js";

describe("TaskGraphValidator Mutants - ArrayDeclaration", () => {
  it("detectCycle with mutated initial path", () => {
    const validator = new TaskGraphValidator();
    const graph: TaskGraph = {
      tasks: [
        { id: "A", dependencies: ["B"] },
        { id: "B", dependencies: ["C"] },
        { id: "C", dependencies: ["B"] }, // cycle B -> C -> B
      ],
    };
    const result = validator.validate(graph);


    // We expect the path initialization array inside `checkCycles` to be []
    // So the cycle extraction should work correctly
    expect(result.errors[0].message).toBe("Cycle detected: B -> C -> B");
  });
});
