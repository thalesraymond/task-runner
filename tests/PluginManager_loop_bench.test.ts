import { describe, it } from "vitest";
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
    for (let i = 0; i < pluginCount; i++) {
      manager.use({
        name: `plugin-${i}`,
        version: "1.0.0",
        install: () => {
          // Sync install
        },
      });
    }

    const start = performance.now();
    await manager.initialize();
    const end = performance.now();

    console.log(`Initialization of ${pluginCount} sync plugins took ${end - start}ms`);
  });
});
