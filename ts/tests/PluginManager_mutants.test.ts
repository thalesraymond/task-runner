import { describe, it, expect } from "vitest";
import { PluginManager } from "../src/PluginManager.js";
import { Plugin } from "../src/contracts/Plugin.js";
import { EventBus } from "../src/EventBus.js";

describe("PluginManager Mutants", () => {
  it("should throw error with correct message when plugin is already registered", () => {
    const eventBus = new EventBus<void>();
    const context = {
      sharedContext: undefined as unknown as void,
      eventBus,
      stateManager: {} as unknown,
      executor: {} as unknown
    } as unknown as unknown;

    /* @ts-expect-error Bypass */
    const manager = new PluginManager<void>(context);
    const plugin: Plugin<void> = { name: "test-plugin", version: "1.0", install: () => {} };

    manager.use(plugin);

    expect(() => manager.use(plugin)).toThrowError("Plugin with name 'test-plugin' is already registered.");
  });

  it("should wait for async plugin installation but not for sync ones without failing", async () => {
    const eventBus = new EventBus<void>();
    const context = {
      sharedContext: undefined as unknown as void,
      eventBus,
      stateManager: {} as unknown,
      executor: {} as unknown
    } as unknown as unknown;

    /* @ts-expect-error Bypass */
    const manager = new PluginManager<void>(context);
    let asyncCalled = false;
    let syncCalled = false;

    const asyncPlugin: Plugin<void> = {
      name: "async-plugin",
      version: "1.0",
      install: async () => {
        return new Promise<void>(resolve => {
          setTimeout(() => {
            asyncCalled = true;
            resolve();
          }, 10);
        });
      }
    };

    const syncPlugin: Plugin<void> = {
      name: "sync-plugin",
      version: "1.0",
      install: () => {
        syncCalled = true;
      }
    };

    manager.use(asyncPlugin);
    manager.use(syncPlugin);

    await manager.initialize();

    expect(asyncCalled).toBe(true);
    expect(syncCalled).toBe(true);
  });
});
