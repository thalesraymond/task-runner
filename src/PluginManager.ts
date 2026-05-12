import { Plugin, PluginContext } from "./contracts/Plugin.js";

/**
 * Manages the lifecycle of plugins.
 */
export class PluginManager<TContext> {
  private readonly plugins: Plugin<TContext>[] = [];
  private readonly registeredPluginNames: Set<string> = new Set();

  constructor(private readonly context: PluginContext<TContext>) {}

  /**
   * Registers a plugin.
   * @param plugin The plugin to register.
   */
  public use(plugin: Plugin<TContext>): void {
    // Check if plugin is already registered
    if (this.registeredPluginNames.has(plugin.name)) {
      // For now, we allow overwriting or just warn?
      // Let's just allow it but maybe log it if we had a logger.
      // Strict check: don't allow duplicate names.
      throw new Error(`Plugin with name '${plugin.name}' is already registered.`);
    }
    this.plugins.push(plugin);
    this.registeredPluginNames.add(plugin.name);
  }

  /**
   * Initializes all registered plugins in parallel.
   */
  public async initialize(): Promise<void> {
    let installPromises: Promise<void>[] | undefined;
    const plugins = this.plugins;
    let i = 0;
    const len = plugins.length;
    while (i < len) {
      const result = plugins[i].install(this.context);
      if (result instanceof Promise) {
        if (!installPromises) {
          installPromises = [];
        }
        installPromises.push(result);
      }
      i++;
    }

    if (installPromises) {
      await Promise.all(installPromises);
    }
  }

  /**
   * Returns the list of registered plugins.
   */
  public getPlugins(): ReadonlyArray<Plugin<TContext>> {
    return this.plugins;
  }
}
