import {
  ListenerMap,
  RunnerEventListener,
  RunnerEventPayloads,
} from "./contracts/RunnerEvents.js";

/**
 * Manages event subscriptions and emissions for the TaskRunner.
 * @template TContext The shape of the shared context object.
 */
export class EventBus<TContext> {
  private listeners: ListenerMap<TContext> = {};

  /**
   * Subscribe to an event.
   * @param event The event name.
   * @param callback The callback to execute when the event is emitted.
   */
  public on<K extends keyof RunnerEventPayloads<TContext>>(
    event: K,
    callback: RunnerEventListener<TContext, K>
  ): void {
    if (!this.listeners[event]) {
      // Type assertion needed because TypeScript cannot verify that the generic K
      // matches the specific key in the mapped type during assignment.
      this.listeners[event] = new Set() as unknown as ListenerMap<TContext>[K];
    }
    // Type assertion needed to tell TS that this specific Set matches the callback type
    (this.listeners[event] as Set<RunnerEventListener<TContext, K>>).add(
      callback
    );
  }

  /**
   * Unsubscribe from an event.
   * @param event The event name.
   * @param callback The callback to remove.
   */
  public off<K extends keyof RunnerEventPayloads<TContext>>(
    event: K,
    callback: RunnerEventListener<TContext, K>
  ): void {
    if (this.listeners[event]) {
      (this.listeners[event] as Set<RunnerEventListener<TContext, K>>).delete(
        callback
      );
    }
  }

  /**
   * Emit an event to all subscribers.
   * @param event The event name.
   * @param data The payload for the event.
   */
  public emit<K extends keyof RunnerEventPayloads<TContext>>(
    event: K,
    data: RunnerEventPayloads<TContext>[K]
  ): void {
    const listeners = this.listeners[event] as
      | Set<RunnerEventListener<TContext, K>>
      | undefined;
    if (listeners) {
      for (const listener of listeners) {
        // We use queueMicrotask() to schedule the listener on the microtask queue,
        // ensuring the emit method remains non-blocking.
        queueMicrotask(() => {
          try {
            try {
              const result = listener(data);
              if (result instanceof Promise) {
                // Handle async listener rejections
                result.catch((error) => {
                  console.error(
                    `Error in event listener for ${String(event)}:`,
                    error
                  );
                });
              }
            } catch (error) {
              // Handle sync listener errors
              console.error(
                `Error in event listener for ${String(event)}:`,
                error
              );
            }
          } catch (error) {
            // detailed handling for the microtask execution itself
            console.error(
              `Unexpected error in event bus execution for ${String(event)}:`,
              error
            );
          }
        });
      }
    }
  }
}
