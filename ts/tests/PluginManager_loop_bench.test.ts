import { describe, it, expect } from "vitest";
import { PluginManager } from "../src/PluginManager.js";
import { EventBus } from "../src/EventBus.js";

import { performance } from "perf_hooks";

interface TestContext {
  [key: string]: unknown;
}

describe("PluginManager Loop Benchmark", () => {
  it("should initialize 100000 sync plugins fast", async () => {
    const eventBus = new EventBus<TestContext>();
    const manager = new PluginManager({ events: eventBus });

    const pluginCount = 100000;
    let installedCount = 0;

    for (let i = 0; i < pluginCount; i++) {
      manager.use({
        name: `plugin-${i}`,
        version: "1.0.0",
        install: () => {
          installedCount++;
        },
      });
    }

    const start = performance.now();
    await manager.initialize();
    const end = performance.now();

    const duration = end - start;
    console.log(`Initialization of ${pluginCount} sync plugins took ${duration}ms`);

    // Verify business logic (state transition)
    expect(installedCount).toBe(pluginCount);
  });
});
