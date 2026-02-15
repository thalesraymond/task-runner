import { Plugin, PluginContext } from "./contracts/Plugin.js";

/**
 * Manages the lifecycle of plugins.
 */
export class PluginManager<TContext> {
  private plugins: Plugin<TContext>[] = [];

  constructor(private context: PluginContext<TContext>) {}

  /**
   * Registers a plugin.
   * @param plugin The plugin to register.
   */
  public use(plugin: Plugin<TContext>): void {
    // Check if plugin is already registered
    if (this.plugins.some((p) => p.name === plugin.name)) {
      // For now, we allow overwriting or just warn?
      // Let's just allow it but maybe log it if we had a logger.
      // Strict check: don't allow duplicate names.
      throw new Error(`Plugin with name '${plugin.name}' is already registered.`);
    }
    this.plugins.push(plugin);
  }

  /**
   * Initializes all registered plugins.
   */
  public async initialize(): Promise<void> {
    for (const plugin of this.plugins) {
      await plugin.install(this.context);
    }
  }

  /**
   * Returns the list of registered plugins.
   */
  public getPlugins(): ReadonlyArray<Plugin<TContext>> {
    return this.plugins;
  }
}
