import { describe, it, expect, vi } from "vitest";
import { TaskStateManager } from "../src/TaskStateManager.js";
import { EventBus } from "../src/EventBus.js";
import { TaskStep } from "../src/TaskStep.js";

describe("TaskStateManager Repro", () => {
  it("should emit taskEnd event when cancelling pending tasks", () => {
    const eventBus = new EventBus<unknown>();
    const emitSpy = vi.spyOn(eventBus, "emit");
    const manager = new TaskStateManager(eventBus);

    const step: TaskStep<unknown> = { name: "step1", run: async () => ({ status: "success" }) };
    manager.initialize([step]);

    manager.cancelAllPending("Cancelled by user");

    expect(emitSpy).toHaveBeenCalledWith("taskEnd", expect.objectContaining({
      step,
      result: expect.objectContaining({ status: "cancelled", message: "Cancelled by user" })
    }));
  });
});
