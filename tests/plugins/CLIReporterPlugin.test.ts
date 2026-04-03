import { describe, it, expect, vi, beforeEach } from "vitest";
import { CLIReporterPlugin } from "../../src/plugins/CLIReporterPlugin.js";
import { EventBus } from "../../src/EventBus.js";
import { PluginContext } from "../../src/contracts/Plugin.js";
import { TaskStep } from "../../src/TaskStep.js";
import { TaskResult } from "../../src/TaskResult.js";

describe("CLIReporterPlugin", () => {
  let plugin: CLIReporterPlugin<unknown>;
  let events: EventBus<unknown>;
  let context: PluginContext<unknown>;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    plugin = new CLIReporterPlugin();
    events = new EventBus();
    context = { events };
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  it("should have correct name and version", () => {
    expect(plugin.name).toBe("cli-reporter");
    expect(plugin.version).toBe("1.0.0");
  });

  it("should output workflow start", async () => {
    plugin.install(context);
    events.emit("workflowStart", { context: {}, steps: [] });
    // events are processed asynchronously
    await new Promise(process.nextTick);

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Starting TaskRunner workflow"));
  });

  it("should output task start", async () => {
    plugin.install(context);
    const step: TaskStep<unknown> = { name: "Step1", run: async () => ({ status: "success" }) };
    events.emit("taskStart", { step });
    await new Promise(process.nextTick);

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Starting: Step1"));
  });

  it("should output task success", async () => {
    plugin.install(context);
    const step: TaskStep<unknown> = { name: "Step1", run: async () => ({ status: "success" }) };
    const result: TaskResult = { status: "success" };
    events.emit("taskEnd", { step, result });
    await new Promise(process.nextTick);

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Success: Step1"));
  });

  it("should output task failure", async () => {
    plugin.install(context);
    const step: TaskStep<unknown> = { name: "Step1", run: async () => ({ status: "failure" }) };
    const result: TaskResult = { status: "failure", error: "Oops" };
    events.emit("taskEnd", { step, result });
    await new Promise(process.nextTick);

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Failed:  Step1 - Oops"));
  });

  it("should output task skip", async () => {
    plugin.install(context);
    const step: TaskStep<unknown> = { name: "Step1", run: async () => ({ status: "success" }) };
    const result: TaskResult = { status: "skipped" };
    events.emit("taskSkipped", { step, result });
    await new Promise(process.nextTick);

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Skipped: Step1"));
  });

  it("should output task skip with error", async () => {
    plugin.install(context);
    const step: TaskStep<unknown> = { name: "Step1", run: async () => ({ status: "success" }) };
    const result: TaskResult = { status: "skipped", error: "Condition failed" };
    events.emit("taskSkipped", { step, result });
    await new Promise(process.nextTick);

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Skipped: Step1 - Condition failed"));
  });

  it("should output summary at workflow end", async () => {
    plugin.install(context);
    events.emit("workflowStart", { context: {}, steps: [] });

    const step1: TaskStep<unknown> = { name: "Step1", run: async () => ({ status: "success" }) };
    events.emit("taskEnd", { step: step1, result: { status: "success" } });

    const step2: TaskStep<unknown> = { name: "Step2", run: async () => ({ status: "failure" }) };
    events.emit("taskEnd", { step: step2, result: { status: "failure" } });

    const step3: TaskStep<unknown> = { name: "Step3", run: async () => ({ status: "success" }) };
    events.emit("taskSkipped", { step: step3, result: { status: "skipped" } });

    events.emit("workflowEnd", { context: {}, results: new Map() });

    await new Promise(process.nextTick);

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Summary:"));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Success: 1"));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Failed:  1"));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Skipped: 1"));
  });
});
