import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { EventBus } from "../src/EventBus.js";
import { TaskStep } from "../src/TaskStep.js";
import { TaskResult } from "../src/TaskResult.js";

describe("EventBus", () => {
  let eventBus: EventBus<any>;
  let consoleSpy: any;

  beforeEach(() => {
    eventBus = new EventBus();
    consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it("should subscribe to and emit events", async () => {
    const callback = vi.fn();
    eventBus.on("taskStart", callback);

    const step = {} as TaskStep<any>;
    eventBus.emit("taskStart", { step });

    // Wait for microtasks
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(callback).toHaveBeenCalledWith({ step });
  });

  it("should unsubscribe from events", async () => {
    const callback = vi.fn();
    eventBus.on("taskStart", callback);
    eventBus.off("taskStart", callback);

    const step = {} as TaskStep<any>;
    eventBus.emit("taskStart", { step });

    // Wait for microtasks
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(callback).not.toHaveBeenCalled();
  });

  it("should handle sync listener errors", async () => {
    const error = new Error("Sync error");
    const callback = vi.fn().mockImplementation(() => {
      throw error;
    });

    eventBus.on("taskStart", callback);
    eventBus.emit("taskStart", { step: {} as any });

    // Wait for microtasks
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(consoleSpy).toHaveBeenCalledWith(
      "Error in event listener for taskStart:",
      error
    );
  });

  it("should handle async listener rejections", async () => {
    const error = new Error("Async error");
    const callback = vi.fn().mockImplementation(async () => {
      throw error;
    });

    eventBus.on("taskStart", callback);
    eventBus.emit("taskStart", { step: {} as any });

    // Wait for microtasks
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(consoleSpy).toHaveBeenCalledWith(
      "Error in event listener for taskStart:",
      error
    );
  });

  it("should handle emit with no listeners", () => {
    expect(() => {
      eventBus.emit("taskStart", { step: {} as any });
    }).not.toThrow();
  });

  it("should handle off for non-existent event", () => {
    const callback = vi.fn();
    expect(() => {
      eventBus.off("taskStart", callback);
    }).not.toThrow();
  });

  it("should handle off for event with no listeners", () => {
    const callback = vi.fn();
    // Subscribe to create the Set, then clear it (simulating empty but existing)
    // Actually, simply calling off without on is the main case, which is covered above.
    // Let's try to cover the branch where listeners[event] exists but the callback isn't in it.
    const otherCallback = vi.fn();
    eventBus.on("taskStart", otherCallback);

    expect(() => {
        eventBus.off("taskStart", callback);
    }).not.toThrow();
  });

  it("should handle off when listener set exists but empty", () => {
       const callback = vi.fn();
       eventBus.on("taskStart", callback);
       eventBus.off("taskStart", callback);
       // Now the set exists but is empty
       eventBus.off("taskStart", callback);
  });

  it("should trigger outer catch block when inner catch fails", async () => {
    const innerError = new Error("Inner error");
    const outerError = new Error("Outer error");

    const callback = vi.fn().mockImplementation(() => {
      throw innerError;
    });

    // Mock console.error to throw on the FIRST call (inner catch), then behave normally (outer catch)
    consoleSpy.mockImplementationOnce(() => {
      throw outerError;
    });

    eventBus.on("taskStart", callback);
    eventBus.emit("taskStart", { step: {} as any });

    // Wait for microtasks
    await new Promise((resolve) => setTimeout(resolve, 0));

    // The first call (which threw) happened in the inner catch.
    // The second call (which succeeded) should happen in the outer catch.
    expect(consoleSpy).toHaveBeenCalledTimes(2);

    // First call was the inner catch logging the listener error (which we made throw)
    expect(consoleSpy).toHaveBeenNthCalledWith(1, "Error in event listener for taskStart:", innerError);

    // Second call should be the outer catch logging the error thrown by the first console.error
    expect(consoleSpy).toHaveBeenNthCalledWith(2, "Unexpected error in event bus execution for taskStart:", outerError);
  });

  it("should handle multiple listeners for the same event", async () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    eventBus.on("taskStart", callback1);
    eventBus.on("taskStart", callback2); // This hits the 'else' branch (listeners already exist)

    eventBus.emit("taskStart", { step: {} as any });

    // Wait for microtasks
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(callback1).toHaveBeenCalled();
    expect(callback2).toHaveBeenCalled();
  });

});
