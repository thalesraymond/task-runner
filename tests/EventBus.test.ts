import { describe, it, expect, vi } from "vitest";
import { EventBus } from "../src/EventBus.js";
import { TaskStep } from "../src/TaskStep.js";
import { TaskResult } from "../src/TaskResult.js";

describe("EventBus", () => {
  it("should handle async listeners throwing errors without crashing", async () => {
    // Use unknown or a generic object instead of any
    const bus = new EventBus<Record<string, unknown>>();
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const error = new Error("Async failure");

    bus.on("taskStart", async () => {
      throw error;
    });

    const mockStep: TaskStep<Record<string, unknown>> = {
        name: "test",
        run: async (): Promise<TaskResult> => ({ status: "success" })
    };

    // This should not throw
    bus.emit("taskStart", { step: mockStep });

    // Wait a tick for promise rejection to be handled
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Error in event listener for taskStart"),
      error
    );

    consoleSpy.mockRestore();
  });
});
