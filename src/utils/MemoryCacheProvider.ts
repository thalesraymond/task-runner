import { ICacheProvider } from "../contracts/ICacheProvider.js";
import { TaskResult } from "../TaskResult.js";

/**
 * A default in-memory implementation of ICacheProvider.
 */
export class MemoryCacheProvider implements ICacheProvider {
  private cache = new Map<string, { value: TaskResult; expiry: number | null }>();

  async get(key: string): Promise<TaskResult | undefined> {
    const entry = this.cache.get(key);
    if (!entry) {
      return undefined;
    }

    if (entry.expiry !== null && Date.now() > entry.expiry) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.value;
  }

  async set(key: string, value: TaskResult, ttl?: number): Promise<void> {
    const expiry = ttl !== undefined ? Date.now() + ttl : null;
    this.cache.set(key, { value, expiry });
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }
}
