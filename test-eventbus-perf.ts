import { EventBus } from "./src/EventBus.js";
import { performance } from "perf_hooks";

const eventBus = new EventBus<unknown>();

// Create 10,000 listeners
for (let i = 0; i < 10000; i++) {
  eventBus.on("taskStart", () => {
    // do nothing
  });
}

const start = performance.now();

// Emit 100 times
for (let i = 0; i < 100; i++) {
  eventBus.emit("taskStart", { step: {} as any });
}

const end = performance.now();
console.log(`Time taken: ${end - start} ms`);
