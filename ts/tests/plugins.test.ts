import { describe, it, expect, vi } from "vitest";
import { Plugin } from "../src/contracts/Plugin.js";
import { PluginManager } from "../src/PluginManager.js";
import { EventBus } from "../src/EventBus.js";
import { PluginContext } from "../src/contracts/Plugin.js";
import { TaskRunner } from "../src/TaskRunner.js";
import { TaskStep } from "../src/TaskStep.js";

interface TestContext {
  [key: string]: unknown;
}

describe("PluginManager", () => {
  it("should register plugins", () => {
    const eventBus = new EventBus<TestContext>();
    const manager = new PluginManager({ events: eventBus });

    const plugin: Plugin<TestContext> = {
      name: "test-plugin",
      version: "1.0.0",
      install: vi.fn(),
    };

    manager.use(plugin);

    expect(manager.getPlugins()).toContain(plugin);
  });

  it("should initialize plugins", async () => {
    const eventBus = new EventBus<TestContext>();
    const manager = new PluginManager({ events: eventBus });
    const installMock = vi.fn();

    const plugin: Plugin<TestContext> = {
      name: "test-plugin",
      version: "1.0.0",
      install: installMock,
    };

    manager.use(plugin);
    await manager.initialize();

    expect(installMock).toHaveBeenCalled();
  });

  it("should not allow duplicate plugins", () => {
    const eventBus = new EventBus<TestContext>();
    const manager = new PluginManager({ events: eventBus });

    const plugin: Plugin<TestContext> = {
      name: "test-plugin",
      version: "1.0.0",
      install: vi.fn(),
    };

    manager.use(plugin);
    expect(() => manager.use(plugin)).toThrow();
  });
});

describe("TaskRunner Plugin Integration", () => {
  it("should call plugin install on execute", async () => {
    const runner = new TaskRunner<TestContext>({});
    const installMock = vi.fn();

    const plugin: Plugin<TestContext> = {
      name: "integration-plugin",
      version: "1.0.0",
      install: installMock,
    };

    runner.use(plugin);

    const step: TaskStep<TestContext> = {
      name: "step1",
      run: async () => ({ status: "success" }),
    };

    await runner.execute([step]);

    expect(installMock).toHaveBeenCalled();
  });

  it("should allow plugins to listen to events", async () => {
    const runner = new TaskRunner<TestContext>({});
    const taskStartMock = vi.fn();

    const plugin: Plugin<TestContext> = {
      name: "event-plugin",
      version: "1.0.0",
      install: (context: PluginContext<TestContext>) => {
        context.events.on("taskStart", taskStartMock);
      },
    };

    runner.use(plugin);

    const step: TaskStep<TestContext> = {
      name: "step1",
      run: async () => ({ status: "success" }),
    };

    await runner.execute([step]);

    expect(taskStartMock).toHaveBeenCalled();
  });
});
