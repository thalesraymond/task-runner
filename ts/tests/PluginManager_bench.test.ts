import { describe, it, expect } from "vitest";
import { PluginManager } from "../src/PluginManager.js";
import { EventBus } from "../src/EventBus.js";
import { Plugin } from "../src/contracts/Plugin.js";
import { performance } from "perf_hooks";

interface TestContext {
  [key: string]: unknown;
}

describe("PluginManager Benchmark", () => {
  it("should initialize plugins in parallel", async () => {
    const eventBus = new EventBus<TestContext>();
    const manager = new PluginManager({ events: eventBus });

    const delay = 100;
    const pluginCount = 5;

    for (let i = 0; i < pluginCount; i++) {
      const plugin: Plugin<TestContext> = {
        name: `plugin-${i}`,
        version: "1.0.0",
        install: async () => {
          await new Promise((resolve) => setTimeout(resolve, delay));
        },
      };
      manager.use(plugin);
    }

    const start = performance.now();
    await manager.initialize();
    const end = performance.now();

    const duration = end - start;
    console.log(`Initialization of ${pluginCount} plugins took ${duration}ms`);

    // In sequential execution, it would take at least delay * pluginCount (500ms)
    // In parallel execution, it should take slightly more than delay (100ms)
    // We use a loose assertion to allow for CI variability but still catch strictly sequential execution.
    expect(duration).toBeLessThan(400);
  });
});
