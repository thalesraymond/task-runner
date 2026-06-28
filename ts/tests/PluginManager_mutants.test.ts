import { describe, it, expect, vi } from "vitest";
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
      executor: {} as unknown,
    } as unknown as unknown;

    /* @ts-expect-error Bypass */
    const manager = new PluginManager<void>(context);
    const plugin: Plugin<void> = {
      name: "test-plugin",
      version: "1.0",
      install: () => {},
    };

    manager.use(plugin);

    expect(() => manager.use(plugin)).toThrowError(
      "Plugin with name 'test-plugin' is already registered."
    );
  });

  it("should wait for async plugin installation but not for sync ones without failing", async () => {
    const eventBus = new EventBus<void>();
    const context = {
      sharedContext: undefined as unknown as void,
      eventBus,
      stateManager: {} as unknown,
      executor: {} as unknown,
    } as unknown as unknown;

    /* @ts-expect-error Bypass */
    const manager = new PluginManager<void>(context);
    let asyncCalled = false;
    let syncCalled = false;

    const asyncPlugin: Plugin<void> = {
      name: "async-plugin",
      version: "1.0",
      install: async () => {
        return new Promise<void>((resolve) => {
          setTimeout(() => {
            asyncCalled = true;
            resolve();
          }, 10);
        });
      },
    };

    const syncPlugin: Plugin<void> = {
      name: "sync-plugin",
      version: "1.0",
      install: () => {
        syncCalled = true;
      },
    };

    manager.use(asyncPlugin);
    manager.use(syncPlugin);

    await manager.initialize();

    expect(asyncCalled).toBe(true);
    expect(syncCalled).toBe(true);
  });

  it("should handle purely synchronous plugins correctly without instantiating promises array", async () => {
    const eventBus = new EventBus<void>();
    const context = {
      sharedContext: undefined as unknown as void,
      eventBus,
      stateManager: {} as unknown,
      executor: {} as unknown,
    } as unknown as unknown;

    /* @ts-expect-error Bypass */
    const manager = new PluginManager<void>(context);

    const syncPlugin: Plugin<void> = {
      name: "sync-plugin-2",
      version: "1.0",
      install: () => {
        return undefined; // Not a promise
      },
    };

    manager.use(syncPlugin);

    const promiseAllSpy = vi.spyOn(Promise, "all");

    await manager.initialize();

    // Promise.all should NOT be called at all if there are only sync plugins
    // because `installPromises` will remain undefined.
    // This kills the mutant replacing `if (result instanceof Promise)` with `if (true)`.
    expect(promiseAllSpy).not.toHaveBeenCalled();
    promiseAllSpy.mockRestore();
  });

  it("should initialize installPromises array properly without mutating array content", async () => {
    const eventBus = new EventBus<void>();
    const context = {
      sharedContext: undefined as unknown as void,
      eventBus,
      stateManager: {} as unknown,
      executor: {} as unknown,
    } as unknown as unknown;

    /* @ts-expect-error Bypass */
    const manager = new PluginManager<void>(context);

    const asyncPlugin: Plugin<void> = {
      name: "async-plugin-3",
      version: "1.0",
      install: async () => {
        return Promise.resolve();
      },
    };

    manager.use(asyncPlugin);

    const promiseAllSpy = vi.spyOn(Promise, "all");

    await manager.initialize();

    // If installPromises was initialized as ["Stryker was here"], Promise.all would have
    // been called with ["Stryker was here", Promise].
    // We check that it was called with exactly an array containing one Promise.
    expect(promiseAllSpy).toHaveBeenCalledTimes(1);
    const args = promiseAllSpy.mock.calls[0][0];
    expect(Array.isArray(args)).toBe(true);
    expect(args).toHaveLength(1);
    expect(args[0]).toBeInstanceOf(Promise);

    promiseAllSpy.mockRestore();
  });

  it("should only initialize installPromises once for multiple async plugins", async () => {
    const eventBus = new EventBus<void>();
    const context = {
      sharedContext: undefined as unknown as void,
      eventBus,
      stateManager: {} as unknown,
      executor: {} as unknown,
    } as unknown as unknown;

    /* @ts-expect-error Bypass */
    const manager = new PluginManager<void>(context);

    manager.use({ name: "p1", version: "1", install: async () => {} });
    manager.use({ name: "p2", version: "1", install: async () => {} });

    // If `if (!installPromises)` is replaced with `if (true)`, it reinitializes `installPromises = []`
    // on the second plugin, losing the first plugin's promise.
    const promiseAllSpy = vi.spyOn(Promise, "all");
    await manager.initialize();

    expect(promiseAllSpy).toHaveBeenCalledTimes(1);
    const args = promiseAllSpy.mock.calls[0][0];
    expect(args).toHaveLength(2); // Should have both promises

    promiseAllSpy.mockRestore();
  });
});
