/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { LoggerPlugin } from "../../src/plugins/LoggerPlugin.js";
import { TaskRunnerBuilder } from "../../src/TaskRunnerBuilder.js";
import { EventBus } from "../../src/EventBus.js";

describe("LoggerPlugin", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let eventBus: EventBus<unknown>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    eventBus = new EventBus<unknown>();
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it("should have correct name and version", () => {
    const plugin = new LoggerPlugin({ format: "text" });
    expect(plugin.name).toBe("logger");
    expect(plugin.version).toBe("1.0.0");
  });

  describe("text format", () => {
    let plugin: LoggerPlugin<unknown>;

    beforeEach(() => {
      plugin = new LoggerPlugin({ format: "text" });
      plugin.install({ events: eventBus });
    });

    it("should log workflowStart", async () => {
      eventBus.emit("workflowStart", { context: {}, steps: [{} as any, {} as any] });
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(logSpy).toHaveBeenCalledWith("[WorkflowStart] Starting workflow with 2 steps.");
    });

    it("should log workflowEnd", async () => {
      const results = new Map();
      results.set("task1", { status: "success" });
      results.set("task2", { status: "failure" });
      results.set("task3", { status: "skipped" });
      eventBus.emit("workflowEnd", { context: {}, results: results as any });
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(logSpy).toHaveBeenCalledWith("[WorkflowEnd] Workflow completed. Success: 1, Failed: 1.");
    });

    it("should log taskStart", async () => {
      eventBus.emit("taskStart", { step: { name: "task1" } as any });
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(logSpy).toHaveBeenCalledWith("[TaskStart] Task 'task1' started.");
    });

    it("should log taskEnd with duration", async () => {
      eventBus.emit("taskEnd", {
        step: { name: "task1" } as any,
        result: { status: "success", metrics: { duration: 500 } } as any,
      });
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(logSpy).toHaveBeenCalledWith("[TaskEnd] Task 'task1' ended with status 'success' in 500ms.");
    });

    it("should log taskEnd without duration", async () => {
      eventBus.emit("taskEnd", {
        step: { name: "task1" } as any,
        result: { status: "success" } as any,
      });
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(logSpy).toHaveBeenCalledWith("[TaskEnd] Task 'task1' ended with status 'success'.");
    });

    it("should log taskSkipped", async () => {
      eventBus.emit("taskSkipped", {
        step: { name: "task1" } as any,
        result: { status: "skipped" } as any,
      });
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(logSpy).toHaveBeenCalledWith("[TaskSkipped] Task 'task1' skipped.");
    });
  });

  describe("json format", () => {
    let plugin: LoggerPlugin<unknown>;

    beforeEach(() => {
      plugin = new LoggerPlugin({ format: "json" });
      plugin.install({ events: eventBus });
    });

    it("should log workflowStart as json", async () => {
      eventBus.emit("workflowStart", { context: {}, steps: [{} as any, {} as any] });
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(logSpy).toHaveBeenCalledTimes(1);
      const jsonStr = logSpy.mock.calls[0][0];
      const data = JSON.parse(jsonStr);
      expect(data.event).toBe("workflowStart");
      expect(data.stepCount).toBe(2);
      expect(data.timestamp).toBeDefined();
    });

    it("should log workflowEnd as json", async () => {
      const results = new Map();
      results.set("task1", { status: "success" });
      results.set("task2", { status: "failure" });
      eventBus.emit("workflowEnd", { context: {}, results: results as any });
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(logSpy).toHaveBeenCalledTimes(1);
      const data = JSON.parse(logSpy.mock.calls[0][0]);
      expect(data.event).toBe("workflowEnd");
      expect(data.totalTasks).toBe(2);
      expect(data.statusSummary).toEqual({ task1: "success", task2: "failure" });
    });

    it("should log taskStart as json", async () => {
      eventBus.emit("taskStart", { step: { name: "task1" } as any });
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(logSpy).toHaveBeenCalledTimes(1);
      const data = JSON.parse(logSpy.mock.calls[0][0]);
      expect(data.event).toBe("taskStart");
      expect(data.task).toBe("task1");
    });

    it("should log taskEnd as json with duration", async () => {
      eventBus.emit("taskEnd", {
        step: { name: "task1" } as any,
        result: { status: "success", metrics: { duration: 500 } } as any,
      });
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(logSpy).toHaveBeenCalledTimes(1);
      const data = JSON.parse(logSpy.mock.calls[0][0]);
      expect(data.event).toBe("taskEnd");
      expect(data.task).toBe("task1");
      expect(data.status).toBe("success");
      expect(data.duration).toBe(500);
    });

    it("should log taskEnd as json without duration", async () => {
      eventBus.emit("taskEnd", {
        step: { name: "task1" } as any,
        result: { status: "success" } as any,
      });
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(logSpy).toHaveBeenCalledTimes(1);
      const data = JSON.parse(logSpy.mock.calls[0][0]);
      expect(data.event).toBe("taskEnd");
      expect(data.duration).toBeUndefined();
    });

    it("should log taskSkipped as json", async () => {
      eventBus.emit("taskSkipped", {
        step: { name: "task1" } as any,
        result: { status: "skipped" } as any,
      });
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(logSpy).toHaveBeenCalledTimes(1);
      const data = JSON.parse(logSpy.mock.calls[0][0]);
      expect(data.event).toBe("taskSkipped");
      expect(data.task).toBe("task1");
      expect(data.status).toBe("skipped");
    });
  });
});

describe("TaskRunnerBuilder LoggerPlugin Integration", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it("should configure text logger via builder and log events", async () => {
    const builder = new TaskRunnerBuilder<Record<string, unknown>>({}).withLogger("text");
    const runner = builder.build();

    await runner.execute([
      {
        name: "test-task",
        run: async () => ({ status: "success" }),
      },
    ]);

    expect(logSpy).toHaveBeenCalled();
    const calls = logSpy.mock.calls.map((c: unknown[]) => c[0]);

    expect(calls.some((c: string) => typeof c === "string" && c.includes("[WorkflowStart]"))).toBe(true);
    expect(calls.some((c: string) => typeof c === "string" && c.includes("[TaskStart] Task 'test-task'"))).toBe(true);
    expect(calls.some((c: string) => typeof c === "string" && c.includes("[TaskEnd] Task 'test-task' ended"))).toBe(true);
    expect(calls.some((c: string) => typeof c === "string" && c.includes("[WorkflowEnd]"))).toBe(true);
  });
});
