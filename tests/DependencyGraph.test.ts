import { describe, it, expect } from "vitest";
import { DependencyGraph } from "../src/DependencyGraph";

describe("DependencyGraph", () => {
  it("should validate a simple DAG", () => {
    const graph = new DependencyGraph();
    graph.addNode("A", []);
    graph.addNode("B", ["A"]);
    expect(() => graph.validate()).not.toThrow();
  });

  it("should throw on missing dependency", () => {
    const graph = new DependencyGraph();
    graph.addNode("A", ["B"]);
    expect(() => graph.validate()).toThrow(/Missing dependency detected/);
  });

  it("should throw on direct cycle", () => {
    const graph = new DependencyGraph();
    graph.addNode("A", ["B"]);
    graph.addNode("B", ["A"]);
    expect(() => graph.validate()).toThrow(/Circular dependency detected/);
  });

  it("should throw on indirect cycle", () => {
    const graph = new DependencyGraph();
    graph.addNode("A", ["B"]);
    graph.addNode("B", ["C"]);
    graph.addNode("C", ["A"]);
    expect(() => graph.validate()).toThrow(/Circular dependency detected/);
  });

  it("should allow disconnected components", () => {
    const graph = new DependencyGraph();
    graph.addNode("A", []);
    graph.addNode("B", []);
    expect(() => graph.validate()).not.toThrow();
  });
});
