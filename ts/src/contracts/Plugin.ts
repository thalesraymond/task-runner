import { EventBus } from "../EventBus.js";

/**
 * Context provided to a plugin during installation.
 * exposes capabilities to hook into the runner lifecycle and context.
 */
export interface PluginContext<TContext> {
  /**
   * The event bus instance to subscribe to runner events.
   */
  events: EventBus<TContext>;
}

/**
 * Interface that all plugins must implement.
 */
export interface Plugin<TContext> {
  /**
   * Unique name of the plugin.
   */
  name: string;
  /**
   * Semantic version of the plugin.
   */
  version: string;
  /**
   * Called when the plugin is installed into the runner.
   * This is where the plugin should subscribe to events or perform setup.
   * @param context The plugin context exposing runner capabilities.
   */
  install(context: PluginContext<TContext>): void | Promise<void>;
}
