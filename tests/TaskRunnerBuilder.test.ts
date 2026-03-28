import { describe, it, expect } from "vitest";
import { TaskRunnerBuilder } from "../src/TaskRunnerBuilder.js";

describe("TaskRunnerBuilder Coverage", () => {
  it("should handle hasOwnProperty false safely", () => {
    const builder = new TaskRunnerBuilder({});
    builder.on("workflowStart", () => {});

    // Force hasOwnProperty to fail
    const originalHasOwnProperty = Object.prototype.hasOwnProperty;
    Object.prototype.hasOwnProperty = () => false;

    expect(() => builder.build()).not.toThrow();

    Object.prototype.hasOwnProperty = originalHasOwnProperty;
  });

  it("should handle undefined callbacks array safely", () => {
    const builder = new TaskRunnerBuilder({});

    // Force listeners object to have an undefined property that passes hasOwnProperty
    Object.assign(builder, { listeners: { workflowStart: undefined } });

    expect(() => builder.build()).not.toThrow();
  });
});
