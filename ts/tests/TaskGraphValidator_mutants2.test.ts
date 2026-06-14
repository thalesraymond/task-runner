import { describe, it, expect } from "vitest";
import { TaskGraphValidator } from "../src/TaskGraphValidator.js";
import { TaskGraph } from "../src/TaskGraph.js";

describe("TaskGraphValidator Mutants - ArrayDeclaration", () => {
  it("detectCycle with mutated initial path", () => {
    const validator = new TaskGraphValidator();
    const graph: TaskGraph = {
      tasks: [
        { id: "A", dependencies: ["B"] },
        { id: "B", dependencies: ["A"] }, // Cycle A->B->A
      ],
    };

    const result = validator.validate(graph);
    expect(result.errors.length).toBe(1);
    expect(result.errors[0].message).toBe("Cycle detected: A -> B -> A");
  });
});
