import { describe, it, expect } from "vitest";
import { TaskStateManager } from "../src/TaskStateManager.js";
import { EventBus } from "../src/EventBus.js";

describe("TaskStateManager uncovered lines", () => {
  it("should cover hasRunningTasks and hasPendingTasks", () => {
    const stateManager = new TaskStateManager(new EventBus());
    expect(stateManager.hasRunningTasks()).toBe(false);
    expect(stateManager.hasPendingTasks()).toBe(false);
  });
});
