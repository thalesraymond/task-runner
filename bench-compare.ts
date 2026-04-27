import { ListenerMap, RunnerEventListener, RunnerEventPayloads } from "./src/contracts/RunnerEvents.js";

class EventBusOriginal<TContext> {
  private listeners: ListenerMap<TContext> = {};

  public on<K extends keyof RunnerEventPayloads<TContext>>(
    event: K,
    callback: RunnerEventListener<TContext, K>
  ): void {
    if (!this.listeners[event]) {
      this.listeners[event] = new Set() as unknown as ListenerMap<TContext>[K];
    }
    (this.listeners[event] as Set<RunnerEventListener<TContext, K>>).add(callback);
  }

  public emit<K extends keyof RunnerEventPayloads<TContext>>(
    event: K,
    data: RunnerEventPayloads<TContext>[K]
  ): void {
    const listeners = this.listeners[event];
    if (listeners) {
      for (const listener of listeners) {
        queueMicrotask(() => {
          try {
            try {
              const result = listener(data);
              if (result instanceof Promise) {
                result.catch((error) => {
                  console.error(error);
                });
              }
            } catch (error) {
              console.error(error);
            }
          } catch (error) {
            console.error(error);
          }
        });
      }
    }
  }
}

class EventBusLoopInsideNoArray<TContext> {
  private listeners: ListenerMap<TContext> = {};

  public on<K extends keyof RunnerEventPayloads<TContext>>(
    event: K,
    callback: RunnerEventListener<TContext, K>
  ): void {
    if (!this.listeners[event]) {
      this.listeners[event] = new Set() as unknown as ListenerMap<TContext>[K];
    }
    (this.listeners[event] as Set<RunnerEventListener<TContext, K>>).add(callback);
  }

  public emit<K extends keyof RunnerEventPayloads<TContext>>(
    event: K,
    data: RunnerEventPayloads<TContext>[K]
  ): void {
    const listeners = this.listeners[event];
    if (listeners) {
      // By wrapping the entire loop inside a single queueMicrotask,
      // we only allocate one closure per emit, instead of one closure
      // per listener per emit.
      queueMicrotask(() => {
        for (const listener of listeners) {
          try {
            try {
              const result = listener(data);
              if (result instanceof Promise) {
                result.catch((error) => {
                  console.error(error);
                });
              }
            } catch (error) {
              console.error(error);
            }
          } catch (error) {
            console.error(error);
          }
        }
      });
    }
  }
}

async function runBench() {
  const listenerCount = 10000;
  const emitCount = 100;

  let eb1 = new EventBusOriginal<unknown>();
  for (let i = 0; i < listenerCount; i++) {
    eb1.on("taskStart", () => {});
  }
  let start1 = performance.now();
  for (let i = 0; i < emitCount; i++) {
    eb1.emit("taskStart", { step: {} as any });
  }
  await new Promise(resolve => setTimeout(resolve, 50));
  let end1 = performance.now();
  console.log(`Original EventBus: ${(end1 - start1).toFixed(2)}ms`);

  let eb2 = new EventBusLoopInsideNoArray<unknown>();
  for (let i = 0; i < listenerCount; i++) {
    eb2.on("taskStart", () => {});
  }
  let start2 = performance.now();
  for (let i = 0; i < emitCount; i++) {
    eb2.emit("taskStart", { step: {} as any });
  }
  await new Promise(resolve => setTimeout(resolve, 50));
  let end2 = performance.now();
  console.log(`Loop Inside Microtask (no Array.from): ${(end2 - start2).toFixed(2)}ms`);
}

runBench();
