import { describe, it, expect, vi } from "vitest";
import { EventBus } from "../src/EventBus.js";

describe("EventBus", () => {
  it("should handle async listeners throwing errors without crashing", async () => {
    const bus = new EventBus<any>();
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const error = new Error("Async failure");

    bus.on("taskStart", async () => {
      throw error;
    });

    // This should not throw
    bus.emit("taskStart", { step: { name: "test", run: async () => ({ status: "success" }) } } as any);

    // Wait a tick for promise rejection to be handled
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Error in event listener for taskStart"),
      error
    );

    consoleSpy.mockRestore();
  });
});
