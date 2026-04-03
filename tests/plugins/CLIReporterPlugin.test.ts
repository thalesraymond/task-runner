import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { CLIReporterPlugin } from "../../src/plugins/CLIReporterPlugin.js";
import { EventBus } from "../../src/EventBus.js";
import { PluginContext } from "../../src/contracts/Plugin.js";

describe("CLIReporterPlugin", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let events: EventBus<unknown>;
  let context: PluginContext<unknown>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    events = new EventBus<unknown>();
    context = { events };

    // Explicitly mock performance.now to return predictable times
    let time = 1000;
    vi.spyOn(performance, "now").mockImplementation(() => {
      const current = time;
      time += 500;
      return current;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should have correct name and version", () => {
    const plugin = new CLIReporterPlugin();
    expect(plugin.name).toBe("cli-reporter");
    expect(plugin.version).toBe("1.0.0");
  });

  it("should log taskStart correctly", async () => {
    const plugin = new CLIReporterPlugin();
    plugin.install(context);

    // Instead of simulating through a runner, we just emit directly on EventBus
    events.emit("taskStart", {
      step: { name: "Step1", run: async () => ({ status: "success" }) }
    });

    // Wait a tick for microtask to execute
    await Promise.resolve();

    expect(logSpy).toHaveBeenCalledWith("[RUNNING] Task Step1");
  });

  it("should log taskSkipped correctly", async () => {
    const plugin = new CLIReporterPlugin();
    plugin.install(context);

    events.emit("taskSkipped", {
      step: { name: "Step1", run: async () => ({ status: "success" }) },
      result: { status: "skipped" }
    });

    await Promise.resolve();

    expect(logSpy).toHaveBeenCalledWith("[SKIPPED] Task Step1");
  });

  it("should log taskEnd success correctly", async () => {
    const plugin = new CLIReporterPlugin();
    plugin.install(context);

    events.emit("taskEnd", {
      step: { name: "Step1", run: async () => ({ status: "success" }) },
      result: { status: "success", metrics: { startTime: 0, endTime: 100, duration: 100 } }
    });

    await Promise.resolve();

    expect(logSpy).toHaveBeenCalledWith("[SUCCESS] Task Step1 (100ms)");
  });

  it("should log taskEnd success correctly without metrics", async () => {
    const plugin = new CLIReporterPlugin();
    plugin.install(context);

    events.emit("taskEnd", {
      step: { name: "Step1", run: async () => ({ status: "success" }) },
      result: { status: "success" }
    });

    await Promise.resolve();

    expect(logSpy).toHaveBeenCalledWith("[SUCCESS] Task Step1");
  });

  it("should log taskEnd failure correctly", async () => {
    const plugin = new CLIReporterPlugin();
    plugin.install(context);

    events.emit("taskEnd", {
      step: { name: "Step1", run: async () => ({ status: "failure" }) },
      result: { status: "failure", error: "Some error" }
    });

    await Promise.resolve();

    expect(logSpy).toHaveBeenCalledWith("[FAILURE] Task Step1 - Some error");
  });

  it("should log taskEnd failure correctly without error message", async () => {
    const plugin = new CLIReporterPlugin();
    plugin.install(context);

    events.emit("taskEnd", {
      step: { name: "Step1", run: async () => ({ status: "failure" }) },
      result: { status: "failure" }
    });

    await Promise.resolve();

    expect(logSpy).toHaveBeenCalledWith("[FAILURE] Task Step1");
  });

  it("should log taskEnd cancelled correctly", async () => {
    const plugin = new CLIReporterPlugin();
    plugin.install(context);

    events.emit("taskEnd", {
      step: { name: "Step1", run: async () => ({ status: "cancelled" }) },
      result: { status: "cancelled" }
    });

    await Promise.resolve();

    expect(logSpy).toHaveBeenCalledWith("[CANCELLED] Task Step1");
  });

  it("should log taskEnd unknown status correctly as skipped", async () => {
    const plugin = new CLIReporterPlugin();
    plugin.install(context);

    // Bypass TS type checking to simulate a runtime unknown status
    events.emit("taskEnd", {
      step: { name: "Step1", run: async () => ({ status: "skipped" }) },
      result: { status: "unknown" } as unknown as { status: "success" }
    });

    await Promise.resolve();

    expect(logSpy).toHaveBeenCalledWith("[SKIPPED] Task Step1");
  });

  it("should reset counters on workflowStart and log summary on workflowEnd", async () => {
    const plugin = new CLIReporterPlugin();
    plugin.install(context);

    events.emit("workflowStart", { context: {}, steps: [] });
    await Promise.resolve();

    events.emit("taskEnd", {
      step: { name: "Step1", run: async () => ({ status: "success" }) },
      result: { status: "success" }
    });
    events.emit("taskEnd", {
      step: { name: "Step2", run: async () => ({ status: "failure" }) },
      result: { status: "failure" }
    });
    events.emit("taskSkipped", {
      step: { name: "Step3", run: async () => ({ status: "success" }) },
      result: { status: "skipped" }
    });
    events.emit("taskEnd", {
      step: { name: "Step4", run: async () => ({ status: "cancelled" }) },
      result: { status: "cancelled" }
    });

    await Promise.resolve();

    events.emit("workflowEnd", { context: {}, results: new Map() });
    await Promise.resolve();

    expect(logSpy).toHaveBeenCalledWith("--- Workflow Execution Summary ---");
    expect(logSpy).toHaveBeenCalledWith("Total Time: 500ms"); // 1st call to performance.now is in workflowStart (1000), 2nd is in workflowEnd (1500)
    expect(logSpy).toHaveBeenCalledWith("Successful: 1");
    expect(logSpy).toHaveBeenCalledWith("Failed: 1");
    expect(logSpy).toHaveBeenCalledWith("Skipped: 2"); // 1 skipped + 1 cancelled
    expect(logSpy).toHaveBeenCalledWith("----------------------------------");
  });
});
