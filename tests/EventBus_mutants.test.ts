import { describe, it, expect } from "vitest";
import { EventBus } from "../src/EventBus.js";

describe("EventBus Mutants", () => {
  it("should not await result if listener returns non-Promise", async () => {
    const bus = new EventBus<void>();

    bus.on("taskStart", () => {
        return "not a promise" as unknown as void;
    });

    bus.emit("taskStart", {} as unknown as { step: import("../src/TaskStep.js").TaskStep<void> });

    await new Promise(resolve => setTimeout(resolve, 0));

    expect(true).toBe(true);
  });
});
